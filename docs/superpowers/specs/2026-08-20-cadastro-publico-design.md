# Cadastro público de usuários — Design

**Data:** 2026-08-20
**Status:** Aprovado

## Contexto

O sistema já possui um endpoint `POST /register`, público (sem `authMiddleware`), usado hoje apenas pela tela **Equipe** (`Users.tsx`, acessível só a usuários logados) para que um admin cadastre novos membros da equipe. O endpoint aceita um campo `role` vindo diretamente do corpo da requisição.

Isso gera um problema de segurança: como o endpoint é público, qualquer requisição direta a `POST /register` (fora da UI) pode se autopromover a `role: "admin"`, sem nenhuma autenticação.

O objetivo desta funcionalidade é permitir que qualquer pessoa crie sua própria conta no sistema (para testes), a partir de uma tela pública de cadastro — e, ao mesmo tempo, fechar essa brecha de segurança.

## Objetivo

1. Permitir que um visitante, sem estar logado, crie uma conta própria no FixOS a partir da tela de login.
2. Garantir que contas criadas por autocadastro público **sempre** recebam `role = "tecnico"`, independentemente do que for enviado no corpo da requisição.
3. Preservar a funcionalidade existente de um admin logado criar membros da equipe com o role de sua escolha (admin ou técnico), mas movendo essa capacidade para um endpoint protegido.

## Não-objetivos

- Verificação de e-mail (envio de e-mail de confirmação) — fora de escopo.
- Recuperação de senha / "esqueci minha senha" — fora de escopo.
- Login automático após o cadastro — decisão explícita do usuário: redirecionar para a tela de login.
- Rate limiting / captcha no cadastro público — fora de escopo desta iteração.

## Arquitetura

### Backend

**`UserController`** (`backend/src/controllers/UserController.ts`)

- Extrair a lógica de criação de usuário (hash de senha com bcrypt + `INSERT INTO users`) para um método privado compartilhado, ex: `private async createUser(name, email, password, role)`, que retorna o `insertId` ou lança o erro (incluindo `ER_DUP_ENTRY`) para o chamador tratar.
- `register(req, res)`: mantém a assinatura pública atual (`POST /register`, sem `authMiddleware`). Passa a ignorar completamente qualquer `role` recebido no corpo — sempre chama `createUser(..., "tecnico")`. Mantém as mesmas validações de campos obrigatórios (`username`, `email`, `password`) e o mesmo tratamento de erro de e-mail duplicado.
- Novo método `createByAdmin(req, res)`: usado pelo novo endpoint protegido. Lê `role` do corpo (default `"tecnico"` se ausente) e chama `createUser(..., role)`. Mesmo tratamento de validação/erro do `register`.

**Rotas** (`backend/src/routes.ts`)

- `POST /register` — sem alteração de path; continua público, sem `authMiddleware`. Comportamento interno muda (role sempre forçado).
- Novo: `POST /users`, com `authMiddleware` + `checkRole(["admin"])`, apontando para `userController.createByAdmin`.

### Frontend

**Nova página `frontend/src/pages/Register.tsx`**

- Reaproveita o layout visual do `Login.tsx` (mesmo card centralizado, cores slate/emerald, mesma estrutura de formulário).
- Campos: Nome, E-mail, Senha, Confirmar Senha.
- Validação client-side antes do submit:
  - Todos os campos obrigatórios preenchidos.
  - Senha e Confirmar Senha devem ser idênticas (senão, exibe erro inline e não envia).
- Submit: `POST /register` com `{ username, email, password }` (sem enviar `role` — o backend ignora mesmo se enviado).
- Sucesso: navega para `/` (Login) passando um estado de sucesso (`navigate("/", { state: { registered: true } })`) para exibir uma mensagem tipo "Conta criada com sucesso! Faça login." na tela de Login.
- Erro (ex: e-mail duplicado — `err.response?.data?.error`): exibe no mesmo padrão visual de erro usado em `Login.tsx`/`Customers.tsx`.

**`frontend/src/pages/Login.tsx`**

- Adiciona link "Ainda não tem conta? Criar conta" abaixo do botão "Entrar no Sistema", navegando para `/register` (via `Link` do `react-router-dom`, consistente com o resto do app).
- Lê `location.state?.registered` (via `useLocation`) para exibir a mensagem de sucesso pós-cadastro, se presente.

**`frontend/src/App.tsx`**

- Nova rota pública: `<Route path="/register" element={<Register />} />` (fora do `PrivateRoute`, mesmo padrão da rota `/`).

**`frontend/src/pages/Users.tsx`**

- `handleCreateUser` passa a chamar `api.post("/users", ...)` em vez de `api.post("/register", ...)`. Nenhuma mudança de UI/UX nessa tela — só o endpoint alvo, já que agora ela representa criação administrativa (com escolha de role), não autocadastro.

## Fluxo de dados

1. Visitante acessa `/`, clica em "Criar conta", vai para `/register`.
2. Preenche nome/e-mail/senha/confirmar senha. Frontend valida senha == confirmação.
3. `POST /register { username, email, password }` → backend força `role: "tecnico"`, faz hash da senha, insere em `users`.
4. Backend responde 201 → frontend navega para `/` com flag de sucesso → usuário faz login normalmente com e-mail/senha recém-criados.
5. (Fluxo existente, sem mudança de UX) Admin logado acessa `/users`, clica em "+ Novo Membro", escolhe role → `POST /users` (agora protegido) → mesma lógica de criação, role explícito.

## Tratamento de erros

- Campos obrigatórios ausentes: mesma resposta 400 já existente (`"Dados incompletos"`).
- E-mail duplicado: mesma resposta 400 já existente (`"Este e-mail já está cadastrado."`), exibida na tela de cadastro.
- Falha de rede/erro 500: mensagem genérica de erro exibida no formulário, mesmo padrão das outras telas do app (`Customers.tsx`, `Login.tsx`).
- Confirmação de senha divergente: validação puramente client-side, erro inline, sem chamada à API.

## Testes

- Não há suíte de testes automatizados configurada no projeto atualmente (`backend/package.json` tem `"test": "echo ... && exit 1"`). Verificação será manual:
  - Cadastro público bem-sucedido cria usuário com `role = "tecnico"` no banco, mesmo se um `role` diferente for forçado via requisição direta (ex: Postman/curl).
  - Login com a conta recém-criada funciona.
  - Tela Equipe continua criando usuários com o role escolhido (admin/técnico), agora via `/users`, exigindo estar autenticado como admin.
  - Tentativa de `POST /users` sem token, ou com token de não-admin, retorna 401/403.
