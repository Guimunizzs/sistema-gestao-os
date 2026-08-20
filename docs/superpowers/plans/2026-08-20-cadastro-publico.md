# Cadastro Público de Usuários Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir que qualquer visitante crie sua própria conta (role fixo `tecnico`) por uma tela pública de cadastro, e mover a criação de usuários com role customizado (feita por admins) para um endpoint protegido separado.

**Architecture:** Backend: extrair lógica de criação de usuário em `UserController` para um método privado compartilhado; `POST /register` (público) sempre força `role="tecnico"`; novo `POST /users` (protegido, admin) aceita `role` explícito. Frontend: nova página `Register.tsx` (mesmo estilo visual do `Login.tsx`), rota pública `/register`, link "Criar conta" na tela de login, e a tela `Users.tsx` passa a chamar `/users` em vez de `/register`.

**Tech Stack:** Express + TypeScript + mysql2 + bcryptjs + jsonwebtoken (backend); React + TypeScript + react-router-dom + axios + Tailwind (frontend). Sem framework de testes automatizados configurado no projeto — verificação via compilação TypeScript (`tsc`) e checagem manual (curl / navegador).

**Spec:** `docs/superpowers/specs/2026-08-20-cadastro-publico-design.md`

---

### Task 1: Backend — extrair lógica de criação e forçar role no `/register`

**Files:**
- Modify: `backend/src/controllers/UserController.ts`

- [ ] **Step 1: Substituir o conteúdo do arquivo**

Substitua o arquivo inteiro por:

```ts
import { Request, Response } from "express";
import pool from "../config/database";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export class UserController {
  private async createUser(
    username: string,
    email: string,
    password: string,
    role: string,
  ) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const sql =
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)";
    const params = [username, email, hashedPassword, role];

    const [result]: any = await pool.execute(sql, params);
    return result.insertId;
  }

  async register(req: Request, res: Response) {
    const { username, password, email } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        error: "Dados incompletos",
        detalhes:
          "username, email e password são obrigatórios e não podem ser undefined.",
      });
    }

    try {
      const userId = await this.createUser(
        username,
        email,
        password,
        "tecnico",
      );

      return res.status(201).json({
        message: "Usuário registrado com sucesso",
        userId,
      });
    } catch (error: any) {
      if (error.code === "ER_DUP_ENTRY") {
        return res
          .status(400)
          .json({ error: "Este e-mail já está cadastrado." });
      }

      return res
        .status(500)
        .json({ error: "Erro interno no servidor", detalhes: error.message });
    }
  }

  async createByAdmin(req: Request, res: Response) {
    const { username, password, email, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        error: "Dados incompletos",
        detalhes:
          "username, email e password são obrigatórios e não podem ser undefined.",
      });
    }

    try {
      const userId = await this.createUser(
        username,
        email,
        password,
        role || "tecnico",
      );

      return res.status(201).json({
        message: "Usuário registrado com sucesso",
        userId,
      });
    } catch (error: any) {
      if (error.code === "ER_DUP_ENTRY") {
        return res
          .status(400)
          .json({ error: "Este e-mail já está cadastrado." });
      }

      return res
        .status(500)
        .json({ error: "Erro interno no servidor", detalhes: error.message });
    }
  }

  async login(req: Request, res: Response) {
    const { email, password } = req.body;

    try {
      const sql = "SELECT * FROM users WHERE email = ?";
      const [rows]: any = await pool.execute(sql, [email]);

      if (rows.length === 0) {
        return res.status(400).json({ error: "Credenciais inválidas" });
      }

      const user = rows[0];
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(400).json({ error: "Credenciais inválidas" });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET as string,
        { expiresIn: "1h" },
      );

      return res.json({ token });
    } catch (error: any) {
      return res
        .status(500)
        .json({ error: "Erro interno no servidor", detalhes: error.message });
    }
  }

  async listAll(req: Request, res: Response) {
    try {
      const sql = "SELECT id, name FROM users ORDER BY name ASC";
      const [rows]: any = await pool.execute(sql);

      return res.json(rows);
    } catch (error: any) {
      return res
        .status(500)
        .json({
          error: "Erro ao listar usuários/técnicos",
          detalhes: error.message,
        });
    }
  }
}
```

Isso muda duas coisas em relação ao original: (1) `register` não lê mais `role` do corpo — sempre passa `"tecnico"` para `createUser`; (2) novo método `createByAdmin` replica a validação do `register`, mas repassa o `role` recebido (default `"tecnico"`).

- [ ] **Step 2: Verificar compilação**

Run: `cd backend && npx tsc --noEmit`
Expected: sem erros de output (exit code 0).

- [ ] **Step 3: Commit**

```bash
git add backend/src/controllers/UserController.ts
git commit -m "refactor: extract user creation and force tecnico role on public register"
```

---

### Task 2: Backend — novo endpoint protegido `POST /users`

**Files:**
- Modify: `backend/src/routes.ts:16-18` (logo após a rota `GET /users` existente)

- [ ] **Step 1: Adicionar a nova rota**

Em `backend/src/routes.ts`, logo após o bloco:

```ts
router.get("/users", authMiddleware, (req, res) =>
  userController.listAll(req, res),
);
```

adicione:

```ts
router.post(
  "/users",
  authMiddleware,
  checkRole(["admin"]),
  (req, res) => userController.createByAdmin(req, res),
);
```

`authMiddleware` e `checkRole` já estão importados no topo do arquivo (usados pela rota `DELETE /orders/:id`).

- [ ] **Step 2: Verificar compilação**

Run: `cd backend && npx tsc --noEmit`
Expected: sem erros de output.

- [ ] **Step 3: Commit**

```bash
git add backend/src/routes.ts
git commit -m "feat: add protected POST /users endpoint for admin-created accounts"
```

---

### Task 3: Backend — rebuild do `dist`

O diretório `backend/dist` está versionado no repositório (usado pelo `render.yaml`/deploy). Depois de qualquer mudança em `backend/src`, ele precisa ser recompilado e commitado junto.

**Files:**
- Modify (gerado): `backend/dist/controllers/UserController.js`
- Modify (gerado): `backend/dist/routes.js`

- [ ] **Step 1: Rebuild**

Run: `cd backend && npx tsc`
Expected: sem output, sem erros.

- [ ] **Step 2: Conferir que só os arquivos esperados mudaram**

Run: `git status --porcelain`
Expected: apenas `backend/dist/controllers/UserController.js` e `backend/dist/routes.js` como modificados (além dos arquivos de `src` já commitados nas tasks anteriores, que já devem estar limpos).

- [ ] **Step 3: Commit**

```bash
git add backend/dist/controllers/UserController.js backend/dist/routes.js
git commit -m "build: rebuild backend dist for user registration changes"
```

---

### Task 4: Frontend — página de cadastro `Register.tsx`

**Files:**
- Create: `frontend/src/pages/Register.tsx`

- [ ] **Step 1: Criar o arquivo**

```tsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Register() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    setError("");

    if (!username || !email || !password || !confirmPassword) {
      setError("Preencha todos os campos.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    try {
      setLoading(true);
      await api.post("/register", { username, email, password });
      navigate("/", { state: { registered: true } });
    } catch (err: any) {
      const mensagemErro =
        err.response?.data?.error || "Erro ao tentar criar conta.";
      setError(mensagemErro);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-md rounded-2xl bg-slate-800 p-8 shadow-xl border border-slate-700">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-emerald-400">FixOS</h1>
          <p className="text-slate-400 mt-2">Criar sua conta</p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleRegister();
          }}
          className="space-y-6"
        >
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400 text-center">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Nome
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg bg-slate-900 border border-slate-700 p-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              placeholder="Seu nome"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg bg-slate-900 border border-slate-700 p-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg bg-slate-900 border border-slate-700 p-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Confirmar Senha
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg bg-slate-900 border border-slate-700 p-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-emerald-500 p-3 font-semibold text-slate-950 hover:bg-emerald-400 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Criando conta..." : "Criar Conta"}
          </button>

          <p className="text-center text-sm text-slate-400">
            Já tem uma conta?{" "}
            <Link
              to="/"
              className="text-emerald-400 hover:text-emerald-300 font-medium"
            >
              Entrar
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificar compilação**

Run: `cd frontend && npx tsc -b --noEmit`
Expected: sem erros de output.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/Register.tsx
git commit -m "feat: add public registration page"
```

---

### Task 5: Frontend — rota pública `/register`

**Files:**
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Importar e adicionar a rota**

Adicione o import junto aos outros, no topo do arquivo:

```tsx
import Register from "./pages/Register";
```

E adicione a rota logo abaixo da rota `/` (fora do `PrivateRoute`):

```tsx
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
```

- [ ] **Step 2: Verificar compilação**

Run: `cd frontend && npx tsc -b --noEmit`
Expected: sem erros de output.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/App.tsx
git commit -m "feat: wire up public /register route"
```

---

### Task 6: Frontend — link "Criar conta" e mensagem de sucesso na tela de Login

**Files:**
- Modify: `frontend/src/pages/Login.tsx`

- [ ] **Step 1: Atualizar imports**

Troque:

```tsx
import { useNavigate } from "react-router-dom";
```

por:

```tsx
import { useNavigate, useLocation, Link } from "react-router-dom";
```

- [ ] **Step 2: Ler o estado de cadastro bem-sucedido**

Logo após `const navigate = useNavigate();`, adicione:

```tsx
  const location = useLocation();
  const registered = Boolean(
    (location.state as { registered?: boolean } | null)?.registered,
  );
```

- [ ] **Step 3: Exibir a mensagem de sucesso**

No JSX, logo antes do bloco `{error && ( ... )}` dentro do `<form>`, adicione:

```tsx
          {registered && (
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-sm text-emerald-400 text-center">
              Conta criada com sucesso! Faça login para continuar.
            </div>
          )}

```

- [ ] **Step 4: Adicionar o link "Criar conta"**

Logo após o `<button type="submit">...</button>` (antes do fechamento de `</form>`), adicione:

```tsx
          <p className="text-center text-sm text-slate-400">
            Ainda não tem conta?{" "}
            <Link
              to="/register"
              className="text-emerald-400 hover:text-emerald-300 font-medium"
            >
              Criar conta
            </Link>
          </p>
```

- [ ] **Step 5: Verificar compilação**

Run: `cd frontend && npx tsc -b --noEmit`
Expected: sem erros de output.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/Login.tsx
git commit -m "feat: link to public registration from login screen"
```

---

### Task 7: Frontend — `Users.tsx` passa a usar o endpoint protegido `/users`

**Files:**
- Modify: `frontend/src/pages/Users.tsx:55`

- [ ] **Step 1: Trocar o endpoint chamado**

Em `handleCreateUser`, troque:

```tsx
      await api.post("/register", {
        username: userName,
        email: userEmail,
        password,
        role,
      });
```

por:

```tsx
      await api.post("/users", {
        username: userName,
        email: userEmail,
        password,
        role,
      });
```

- [ ] **Step 2: Verificar compilação**

Run: `cd frontend && npx tsc -b --noEmit`
Expected: sem erros de output.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/Users.tsx
git commit -m "fix: create team members through protected /users endpoint"
```

---

### Task 8: Verificação manual end-to-end

Esta task não gera commit — é checklist de verificação. Requer o backend rodando localmente (`cd backend && npm run dev`) com `.env` apontando para um banco MySQL válido (mesmas variáveis usadas em `backend/src/config/database.ts`), e o frontend rodando (`cd frontend && npm run dev`).

- [ ] **Step 1: Cadastro público cria conta como `tecnico`**

No navegador: acesse a tela de login, clique em "Criar conta", preencha nome/e-mail/senha/confirmar senha com um e-mail novo, envie.
Expected: redireciona para `/` com a mensagem "Conta criada com sucesso! Faça login para continuar."

Confira no banco:
```sql
SELECT name, email, role FROM users WHERE email = '<email usado>';
```
Expected: `role = 'tecnico'`.

- [ ] **Step 2: Login com a conta recém-criada funciona**

Na tela de login, entre com o e-mail/senha criados no Step 1.
Expected: redireciona para `/dashboard`.

- [ ] **Step 3: `POST /register` ignora `role` mesmo se enviado diretamente**

Run (ajuste a URL se o backend local rodar em outra porta):
```bash
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{"username":"Teste Curl","email":"teste.curl@example.com","password":"senha123","role":"admin"}'
```
Expected: resposta 201. Confira no banco que o `role` do usuário criado é `tecnico`, não `admin`.

- [ ] **Step 4: `POST /users` exige admin**

Sem token:
```bash
curl -i -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"username":"Sem Token","email":"semtoken@example.com","password":"senha123","role":"tecnico"}'
```
Expected: `401`.

Com token de uma conta `tecnico` (faça login com uma conta técnica e use o token retornado):
```bash
curl -i -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token de tecnico>" \
  -d '{"username":"Tecnico Tentando","email":"tecnicotentando@example.com","password":"senha123","role":"admin"}'
```
Expected: `403`.

- [ ] **Step 5: Tela Equipe continua funcionando para admins**

Logado como admin, vá em "Equipe" → "+ Novo Membro", crie um usuário com role `admin` e outro com role `tecnico`.
Expected: ambos aparecem na listagem com o role correto; a requisição de rede (DevTools) mostra `POST /users`, não `POST /register`.
