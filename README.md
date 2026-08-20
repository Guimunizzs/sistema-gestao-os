# FixOS — Sistema de Gestão de Ordens de Serviço

![License](https://img.shields.io/badge/license-MIT-emerald)
![TypeScript](https://img.shields.io/badge/TypeScript-blue?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Node](https://img.shields.io/badge/Node.js-Express%205-339933?logo=node.js&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-Aiven-4479A1?logo=mysql&logoColor=white)

Sistema web completo para gestão de ordens de serviço de uma assistência técnica: controle de clientes, abertura e acompanhamento de OS (do orçamento à entrega), gestão de equipe técnica e dashboard com indicadores de faturamento.

**🔗 Demo:** [sistema-gestao-os-phi.vercel.app](https://sistema-gestao-os-phi.vercel.app/)

> A API roda em [Render](https://render.com) e o banco de dados MySQL é hospedado no [Aiven](https://aiven.io). Por serem serviços gratuitos, a primeira requisição pode demorar alguns segundos (cold start).

---

## Sobre o projeto

O FixOS nasceu para resolver um problema real de assistências técnicas: acompanhar o ciclo de vida de um equipamento em conserto — desde a entrada até a entrega — com histórico auditável de cada mudança de status, sem depender de planilhas.

O sistema tem dois perfis de acesso (**admin** e **técnico**), autenticação via JWT, e uma separação clara entre cadastro público (qualquer visitante pode criar uma conta para testar o sistema) e gestão administrativa (apenas admins escolhem o nível de permissão de um novo membro da equipe).

## Funcionalidades

**Autenticação**
- Login com e-mail e senha (JWT)
- Cadastro público de conta (sempre criada como técnico, por segurança)
- Controle de acesso por papel (`admin` / `tecnico`) em rotas sensíveis da API

**Ordens de Serviço**
- Abertura de OS vinculada a um cliente e a um equipamento (marca, número de série, defeito relatado)
- Fluxo de status: `aberta` → `em_orçamento` → `em_manutenção` → `finalizada` → `entregue`
- Laudo técnico e valor final por OS
- Histórico completo de mudanças de status por ordem (auditoria), gravado em transação junto com cada atualização

**Clientes**
- Cadastro e listagem de clientes (nome, telefone, e-mail, documento, endereço)

**Equipe**
- Administradores cadastram técnicos e outros administradores, com escolha do nível de permissão

**Dashboard**
- Faturamento total (ordens finalizadas/entregues)
- Contagem de ordens por status

## Tecnologias

**Frontend**
- React 19 + TypeScript
- Vite
- Tailwind CSS 4
- React Router 7
- Axios

**Backend**
- Node.js + Express 5 + TypeScript
- MySQL (via `mysql2`)
- JWT (`jsonwebtoken`) para autenticação
- `bcryptjs` para hash de senha

**Infraestrutura**
- Frontend: [Vercel](https://vercel.com)
- Backend: [Render](https://render.com)
- Banco de dados: MySQL gerenciado ([Aiven](https://aiven.io))

## Arquitetura

```
sistema-gestao-os/
├── backend/
│   └── src/
│       ├── controllers/     # Regras de negócio (Order, Customer, User)
│       ├── middlewares/     # authMiddleware (JWT) e checkRole (RBAC)
│       ├── config/          # Pool de conexão MySQL
│       └── routes.ts        # Definição das rotas da API
└── frontend/
    └── src/
        ├── pages/           # Login, Register, Dashboard, Orders, Customers, Users
        └── services/        # Cliente Axios configurado
```

Pontos de design que valem destaque:
- **Rotas protegidas por papel**: `authMiddleware` valida o JWT e `checkRole(["admin"])` restringe endpoints administrativos (ex: exclusão de OS, criação de usuários com papel customizado).
- **Cadastro público seguro**: o endpoint público de registro força o papel `tecnico` no servidor, independentemente do que for enviado no corpo da requisição — a escolha de papel só é possível através do endpoint administrativo autenticado.
- **Escrita transacional com auditoria**: abertura e atualização de OS usam transações MySQL (`beginTransaction`/`commit`/`rollback`) e gravam cada mudança de status em `order_history`.

## Como rodar localmente

### Pré-requisitos
- Node.js 18+
- Um banco de dados MySQL acessível (local ou gerenciado)

### 1. Clonar o repositório
```bash
git clone https://github.com/Guimunizzs/sistema-gestao-os.git
cd sistema-gestao-os
```

### 2. Backend
```bash
cd backend
npm install
```

Crie um arquivo `.env` em `backend/` com:

| Variável      | Descrição                              |
|---------------|-----------------------------------------|
| `DB_HOST`     | Host do banco MySQL                     |
| `DB_PORT`     | Porta do banco MySQL                    |
| `DB_USER`     | Usuário do banco                        |
| `DB_PASSWORD` | Senha do banco                          |
| `DB_NAME`     | Nome do banco                           |
| `PORT`        | Porta em que a API vai rodar (ex: 3001) |
| `JWT_SECRET`  | Segredo usado para assinar os tokens JWT|

```bash
npm run dev
```

### 3. Frontend
```bash
cd frontend
npm install
```

Crie um arquivo `.env` em `frontend/` com:

| Variável        | Descrição                                  |
|-----------------|---------------------------------------------|
| `VITE_API_URL`  | URL da API backend (ex: `http://localhost:3001`) |

```bash
npm run dev
```

A aplicação abre em `http://localhost:5173` (padrão do Vite) e espera a API rodando em `VITE_API_URL`.

## Roadmap

Melhorias planejadas para as próximas iterações:

- [ ] Testes automatizados (backend e frontend)
- [ ] Edição e exclusão de clientes
- [ ] Busca e paginação na listagem de ordens de serviço
- [ ] Gráficos no dashboard (evolução de faturamento, distribuição por status)
- [ ] Fluxo de recuperação de senha

## Licença

Distribuído sob a licença MIT. Veja [LICENSE](./LICENSE) para mais detalhes.

## Autor

**Guilherme Muniz**
