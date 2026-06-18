# Turborepo microservices (NestJS)

Monorepo **event-driven** com HTTP público só onde fizer sentido: [Turborepo](https://turborepo.dev/), [pnpm](https://pnpm.io/), **Prisma 7**, **RabbitMQ**, **Outbox** e **API Gateway**.

## Modelo: eventos primeiro, HTTP seletivo

```
Cliente
   │
   ▼
gateway :4000/api/users     ← só APIs públicas
   │
   ▼
users-service (HTTP + outbox) ──► users_db
   │
   └── RabbitMQ domain.events
            │
            ├──► orders-service (events-only, /health interno)
            └──► notification-service (futuro, --consumer-only)
```

Diagrama (outbox + gateway seletivo): [`docs/architecture.excalidraw`](docs/architecture.excalidraw) — abra no [excalidraw.com](https://excalidraw.com) ou extensão Excalidraw

### Matriz de exposição

| Serviço | Perfil | Gateway | RabbitMQ | Banco |
|---------|--------|---------|----------|-------|
| `gateway` | HTTP entrada | — | — | — |
| `users-service` | **HTTP** + publisher | ✅ `/api/users` | publica `user.*` | `users_db` |
| `orders-service` | **events-only** | ❌ | consome `user.*` | `orders_db` |
| futuro `notification` | **events-only** | ❌ | consome eventos | próprio |

> **Regra:** se o MS não precisa de API externa, use `--consumer-only`. Só registre proxy no gateway para serviços `--http`.

## Outbox (`users-service`)

Eventos são gravados na tabela `outbox_events` **na mesma transação** do usuário; o `OutboxProcessor` publica no RabbitMQ a cada 2s.

```sh
pnpm db:migrate:users   # inclui migration outbox_events
```

Fluxo: `POST /users` → commit em `users` + `outbox_events` → processor → `user.created` no RabbitMQ.

## Infraestrutura (Docker)

```sh
cp docker/.env.example docker/.env
pnpm docker:up:all      # Postgres + RabbitMQ
pnpm db:migrate:users
```

| Serviço | Porta | UI |
|---------|-------|-----|
| Postgres | 5432 | — |
| RabbitMQ | 5672 | http://localhost:15672 (`guest`/`guest`) |

## Supabase (PostgreSQL na nuvem)

Um projeto Supabase = **uma** base `postgres`. Os pacotes `users` e `orders` podem usar a **mesma URL** (tabelas `users`, `outbox_events`, `orders` no schema `public`).

| Variável | Uso | Porta típica |
|----------|-----|----------------|
| `*_DATABASE_URL` | Apps + Prisma Client (pooler) | **6543** + `?pgbouncer=true` |
| `*_DIRECT_URL` ou `DIRECT_URL` | `prisma migrate`, `db push`, Studio | **5432** |

Copie os exemplos e troque `YOUR_PASSWORD` (Dashboard → Project Settings → Database):

```sh
cp packages/database/users/.env.example packages/database/users/.env
cp packages/database/orders/.env.example packages/database/orders/.env
cp apps/users-service/.env.example apps/users-service/.env
cp apps/orders-service/.env.example apps/orders-service/.env
# Edite os .env com sua senha real (não commite .env)
```

Criar tabelas no Supabase (conexão **direct** via `USERS_DIRECT_URL` / `ORDERS_DIRECT_URL`):

```sh
pnpm --filter @repo/database-users exec prisma migrate deploy
pnpm --filter @repo/database-orders exec prisma migrate deploy
```

URL pooler (runtime), como no dashboard Supabase:

```env
USERS_DATABASE_URL="postgresql://postgres.PROJECT_REF:YOUR_PASSWORD@aws-1-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
USERS_DIRECT_URL="postgresql://postgres.PROJECT_REF:YOUR_PASSWORD@aws-1-us-west-2.pooler.supabase.com:5432/postgres"
```

`ORDERS_DATABASE_URL` e `ORDERS_DIRECT_URL` = mesmos valores se for o mesmo projeto.

## Rodar localmente

```sh
nvm use && pnpm install
cp docker/.env.example docker/.env
pnpm docker:up:all
pnpm db:migrate:users

pnpm --filter @repo/database-users build
pnpm --filter @repo/messaging build

# Terminal 1 — API pública
cp apps/users-service/.env.example apps/users-service/.env
pnpm --filter users-service dev

# Terminal 2 — gateway
cp apps/gateway/.env.example apps/gateway/.env
pnpm --filter gateway dev

# Terminal 3 — consumer (sem gateway)
cp apps/orders-service/.env.example apps/orders-service/.env
pnpm --filter orders-service dev
```

### Testar

| Ação | URL |
|------|-----|
| Criar user (gateway) | `POST http://localhost:4000/api/users` |
| Criar user (direto) | `POST http://localhost:3000/users` |
| Health gateway | `GET http://localhost:4000/api/health` |
| Health orders (interno) | `GET http://localhost:3002/health` |

REST Client: `apps/gateway/requests.http`, `apps/users-service/requests.http`

## Criar microserviço

```sh
# API REST + publica eventos (registrar proxy no gateway)
pnpm create:service billing --port 3003 --with-db

# Só eventos + health interno (sem gateway)
pnpm create:service notification --consumer-only --bindings user.created,order.created

pnpm create:database auth
```

### Registrar nova API no gateway

1. Crie o MS com perfil HTTP (padrão)
2. Copie `apps/gateway/src/proxy/users-proxy.controller.ts` → `billing-proxy.controller.ts`
3. Registre em `proxy.module.ts` e `public-routes.ts`
4. Adicione `BILLING_SERVICE_URL` em `apps/gateway/.env`

## Eventos (`@repo/messaging`)

Envelope versionado:

```json
{
  "version": 1,
  "type": "user.created",
  "data": { "userId": "..." },
  "occurredAt": "...",
  "metadata": { "source": "users-service" }
}
```

## users-service (CRUD)

| Método | Rota | Efeito |
|--------|------|--------|
| POST | `/users` | Cria + outbox → `user.created` |
| GET | `/users` | Lista |
| PATCH | `/users/:id` | Atualiza + `user.updated` |
| DELETE | `/users/:id` | Remove + `user.deleted` |

## Pacotes compartilhados

| Pacote | Uso |
|--------|-----|
| `@repo/messaging` | RabbitMQ + envelopes |
| `@repo/database-*` | Prisma por domínio |
| `@repo/typescript-config` | tsconfig Nest |

## CI

```sh
pnpm validate
pnpm validate:affected   # PRs
```

## Estrutura

```
apps/
  gateway/              # só proxies de APIs públicas
  users-service/        # HTTP + outbox + publisher
  orders-service/       # events-only
packages/
  messaging/
  database/
scripts/
  create-microservice.mjs
  create-database-package.mjs
```
