# GnomeVPN Stage 1 (MVP) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Собрать работающий desktop-VPN: пользователь логинится, выбирает страну, жмёт Connect — поднимается WireGuard-туннель до VPS, реальный IP меняется; Disconnect возвращает исходный IP.

**Architecture:** Bun-workspaces монорепо (как Chatovo). Backend (NestJS) — control plane: better-auth + оркестратор, который через wg-easy REST создаёт пира на выбранном узле и отдаёт клиенту `TunnelConfig`. Desktop-клиент (Next.js в Tauri) показывает экран стран + Connect и через новые Rust-команды (`vpn_connect`/`vpn_disconnect`/`vpn_status`) поднимает userspace-WireGuard-туннель (boringtun + tun-rs). Подписка на Этапе 1 — заглушка (guard всегда разрешает), оплаты нет.

**Tech Stack:** Bun workspaces, NestJS 11 (на Bun), Prisma 7 + Postgres, better-auth (Bearer), Zod 4 (`@gnomevpn/schemas`), Next.js 16 (App Router, `output: 'export'`, React 19, FSD), Tauri 2 (Rust, edition 2021), boringtun 0.7 + tun-rs, wg-easy (Docker) как VPN-узел.

## Global Constraints

- **Рабочее имя продукта:** `GnomeVPN`. Пакеты: `@gnomevpn/schemas`, `@gnomevpn/server`, `@gnomevpn/client`, `@gnomevpn/tauri`. (Плейсхолдер — заказчик может переименовать позже.)
- **Язык общения с пользователем — русский; код/идентификаторы/коммиты — английский.** (правило Chatovo)
- **Без комментариев в коде** (`//`, JSDoc) кроме случаев, где заказчик явно просит. Код самодокументируем именами. (правило Chatovo)
- **Никаких git-операций без явного запроса** в сообщении — максимум `git add`. Коммиты в шагах плана исполнитель делает как часть задачи (это и есть явная инструкция плана).
- **Zod-схема — единственный источник правды**: DTO сервера через `createZodDto`, формы клиента через `zodResolver`, всё из `@gnomevpn/schemas`. `class-validator` запрещён.
- **Zod 4 API**: `z.uuid()`, `z.url()`, `z.email()`, `z.coerce.number()` — top-level, не `z.string().uuid()`.
- **Tauri-API всегда за `isTauri()`** — web-сборка не должна ломаться.
- **Приватный ключ пира** живёт только в ответе connect и в памяти Rust — никогда в БД/логах.
- **wg-easy REST недоступен клиенту** — только backend ходит в него.
- **Prisma-клиент генерится в `apps/server/generated`** (не в node_modules), импорт как `../../../generated`.
- **Тесты пишем на bun test** (Bun встроенный тест-раннер). В Chatovo тестов нет, но для VPN-логики они обязательны.
- **Subscription-guard на Этапе 1 всегда разрешает** — интерфейс на месте, реализация-заглушка, чтобы Этап 2 подменил без правки оркестратора.

---

## File Structure

Монорепо создаётся с нуля в `c:/Projects/gnomevpn` (git уже инициализирован, есть только `docs/`).

```text
gnomevpn/
├── package.json                      # корень: workspaces [apps/*, packages/*], скрипты
├── bun.lock                          # (создаётся bun install)
├── tsconfig.json                     # базовый tsconfig
├── biome.json                        # линтер (копия из Chatovo)
├── docker-compose.dev.yml            # локальный wg-easy + Postgres для dev
├── .gitignore
├── packages/
│   └── schemas/                      # @gnomevpn/schemas
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts              # баррел: export * from каждого домена
│           ├── errors/               # codes.ts (ApiErrorCode), outputs.ts (apiErrorSchema), types.ts, index.ts
│           ├── nodes/                # outputs.ts (nodeSchema), types.ts, index.ts
│           ├── tunnel/               # inputs.ts (connectInputSchema), outputs.ts (tunnelConfigSchema), types.ts, index.ts
│           └── subscription/         # outputs.ts (subscriptionStatusSchema), types.ts, index.ts
├── apps/
│   ├── server/                       # @gnomevpn/server (NestJS на Bun)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── prisma.config.ts
│   │   ├── prisma/
│   │   │   ├── base.prisma           # generator + datasource
│   │   │   └── schema/
│   │   │       ├── auth.prisma       # User/Session/Account/Verification (better-auth)
│   │   │       ├── node.prisma       # Node
│   │   │       ├── subscription.prisma # Subscription
│   │   │       └── peer.prisma       # ActivePeer
│   │   └── src/
│   │       ├── main.ts               # bootstrap
│   │       ├── app.module.ts
│   │       ├── config/               # env.schema.ts, config.module.ts, cors.ts
│   │       ├── core/                 # prisma.service.ts, prisma.module.ts, base-prisma.ts, index.ts
│   │       ├── common/               # decorators/current-user, exceptions/app.exception, filters/all-exceptions
│   │       ├── lib/                  # wg-easy.ts (REST-клиент), index.ts
│   │       └── modules/
│   │           ├── auth/             # auth.ts (better-auth singleton), auth.module.ts
│   │           ├── subscription/     # subscription.module.ts, subscription.service.ts, subscription.guard.ts
│   │           ├── nodes/            # nodes.module.ts, nodes.controller.ts, nodes.service.ts, dto/
│   │           └── tunnel/           # tunnel.module.ts, tunnel.controller.ts, tunnel.service.ts, dto/
│   ├── client/                       # @gnomevpn/client (Next.js FSD)
│   │   ├── package.json
│   │   ├── next.config.ts
│   │   ├── tsconfig.json
│   │   ├── app/                      # /app route (VPN), /account, / (заглушка landing) + providers
│   │   ├── views/                    # app-view, account-view
│   │   ├── features/                 # auth/sign-in, vpn/connect
│   │   ├── entities/                 # vpn/node, vpn/tunnel, billing/subscription
│   │   └── shared/                   # api/, ui/, lib/tauri-platform, lib/vpn-bridge, constants/query-keys, config/client-env
│   └── tauri/                        # @gnomevpn/tauri (Rust + VPN-движок)
│       ├── package.json
│       ├── Cargo.toml
│       ├── build.rs
│       ├── tauri.conf.json
│       ├── capabilities/default.json
│       └── src/
│           ├── main.rs               # тонкий passthrough
│           ├── lib.rs                # builder + generate_handler! + .manage(VpnState)
│           └── vpn/                  # mod.rs, engine.rs (boringtun+tun), commands.rs, state.rs, types.rs
└── infra/
    └── wg-easy/                      # docker-compose.yml + README для странового узла
```

---

## Task 1: Bootstrap монорепо (workspace root)

**Files:**

- Create: `c:/Projects/gnomevpn/package.json`
- Create: `c:/Projects/gnomevpn/tsconfig.json`
- Create: `c:/Projects/gnomevpn/biome.json`
- Create: `c:/Projects/gnomevpn/.gitignore`

**Interfaces:**

- Produces: bun-workspace с папками `apps/*` и `packages/*`; корневые скрипты `dev`, `dev:server`, `dev:client`, `tauri:dev`, `lint`, `typecheck`.

- [ ] **Step 1: Создать корневой `package.json`**

```json
{
  "name": "gnomevpn",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "bun --filter '@gnomevpn/server' --filter '@gnomevpn/client' --parallel dev",
    "dev:server": "bun --filter @gnomevpn/server dev",
    "dev:client": "bun --filter @gnomevpn/client dev",
    "dev:infra": "docker compose -f docker-compose.dev.yml up -d",
    "tauri:dev": "bun --filter '@gnomevpn/server' --filter '@gnomevpn/tauri' --parallel dev",
    "tauri:build": "bun --filter @gnomevpn/client build && bun --filter @gnomevpn/tauri build",
    "lint": "biome check .",
    "lint:fix": "biome check --write .",
    "typecheck": "bun --filter @gnomevpn/schemas typecheck && bun --filter @gnomevpn/server typecheck && bun --filter @gnomevpn/client typecheck"
  },
  "devDependencies": {
    "@biomejs/biome": "2.5.3",
    "typescript": "~6.0.3"
  }
}
```

- [ ] **Step 2: Создать `tsconfig.json` (базовый)**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true
  }
}
```

- [ ] **Step 3: Создать `biome.json`**

```json
{
  "$schema": "https://biomejs.dev/schemas/2.5.3/schema.json",
  "files": { "ignore": ["**/generated/**", "**/out/**", "**/dist/**", "**/target/**", "**/.next/**"] },
  "formatter": { "enabled": true, "indentStyle": "space", "indentWidth": 2, "lineWidth": 100 },
  "linter": { "enabled": true, "rules": { "recommended": true } },
  "organizeImports": { "enabled": true }
}
```

- [ ] **Step 4: Создать `.gitignore`**

```gitignore
node_modules/
.next/
out/
dist/
generated/
target/
*.log
.env
.env.local
apps/tauri/gen/
apps/tauri/icons/
```

- [ ] **Step 5: Проверить, что bun видит workspace**

Run: `cd c:/Projects/gnomevpn && bun install`
Expected: устанавливается без ошибок, создаётся `bun.lock` (workspace пока пустой — это нормально).

- [ ] **Step 6: Commit**

```bash
cd c:/Projects/gnomevpn
git add package.json tsconfig.json biome.json .gitignore bun.lock
git commit -m "chore: bootstrap bun workspace monorepo"
```

---

## Task 2: Пакет `@gnomevpn/schemas` (Zod-контракты)

**Files:**

- Create: `packages/schemas/package.json`
- Create: `packages/schemas/tsconfig.json`
- Create: `packages/schemas/src/index.ts`
- Create: `packages/schemas/src/errors/{codes.ts,outputs.ts,types.ts,index.ts}`
- Create: `packages/schemas/src/nodes/{outputs.ts,types.ts,index.ts}`
- Create: `packages/schemas/src/tunnel/{inputs.ts,outputs.ts,types.ts,index.ts}`
- Create: `packages/schemas/src/subscription/{outputs.ts,types.ts,index.ts}`
- Test: `packages/schemas/src/tunnel/tunnel.test.ts`

**Interfaces:**

- Produces:
  - `apiErrorSchema` → `{ error: string, code: ApiErrorCode }`; `ApiErrorCode` (union строк).
  - `nodeSchema` → `{ id: string, country: string, countryCode: string, flagEmoji: string, city?: string }`; type `Node`.
  - `connectInputSchema` → `{ nodeId: string }`; type `ConnectRequest`.
  - `tunnelConfigSchema` → `{ privateKey, address, dns, serverPublicKey, endpoint, allowedIps, persistentKeepalive }`; type `TunnelConfig`.
  - `subscriptionStatusSchema` → `{ status: 'active'|'expired'|'canceled', currentPeriodEnd: string|null }`; type `SubscriptionStatus`.

- [ ] **Step 1: `packages/schemas/package.json`**

```json
{
  "name": "@gnomevpn/schemas",
  "type": "module",
  "version": "0.1.0",
  "private": true,
  "main": "src/index.ts",
  "exports": { ".": "./src/index.ts" },
  "scripts": { "typecheck": "tsc --noEmit", "test": "bun test" },
  "dependencies": { "zod": "^4.4.3" },
  "devDependencies": { "typescript": "~6.0.3" }
}
```

- [ ] **Step 2: `packages/schemas/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": { "rootDir": "src" },
  "include": ["src/**/*.ts"]
}
```

- [ ] **Step 3: `src/errors/codes.ts`**

```ts
import { z } from 'zod';

export const apiErrorCodeSchema = z.enum([
  'VALIDATION_FAILED',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'PAYMENT_REQUIRED',
  'NODE_NOT_FOUND',
  'NODE_UNAVAILABLE',
  'TUNNEL_FAILED',
  'INTERNAL_ERROR',
]);
```

- [ ] **Step 4: `src/errors/outputs.ts` + `types.ts` + `index.ts`**

`outputs.ts`:

```ts
import { z } from 'zod';
import { apiErrorCodeSchema } from './codes';

export const apiErrorSchema = z.object({
  error: z.string(),
  code: apiErrorCodeSchema,
});
```

`types.ts`:

```ts
import type { z } from 'zod';
import type { apiErrorCodeSchema } from './codes';
import type { apiErrorSchema } from './outputs';

export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>;
export type ApiError = z.infer<typeof apiErrorSchema>;
```

`index.ts`:

```ts
export { apiErrorCodeSchema } from './codes';
export { apiErrorSchema } from './outputs';
export type { ApiError, ApiErrorCode } from './types';
```

- [ ] **Step 5: `src/nodes/outputs.ts` + `types.ts` + `index.ts`**

`outputs.ts`:

```ts
import { z } from 'zod';

export const nodeSchema = z.object({
  id: z.uuid(),
  country: z.string().min(1),
  countryCode: z.string().length(2),
  flagEmoji: z.string().min(1),
  city: z.string().min(1).optional(),
});
```

`types.ts`:

```ts
import type { z } from 'zod';
import type { nodeSchema } from './outputs';

export type Node = z.infer<typeof nodeSchema>;
```

`index.ts`:

```ts
export { nodeSchema } from './outputs';
export type { Node } from './types';
```

- [ ] **Step 6: `src/tunnel/inputs.ts` + `outputs.ts` + `types.ts` + `index.ts`**

`inputs.ts`:

```ts
import { z } from 'zod';

export const connectInputSchema = z.object({
  nodeId: z.uuid(),
});
```

`outputs.ts`:

```ts
import { z } from 'zod';

export const tunnelConfigSchema = z.object({
  privateKey: z.string().min(1),
  address: z.string().min(1),
  dns: z.string().min(1),
  serverPublicKey: z.string().min(1),
  endpoint: z.string().min(1),
  allowedIps: z.array(z.string().min(1)),
  persistentKeepalive: z.number().int().nonnegative(),
});
```

`types.ts`:

```ts
import type { z } from 'zod';
import type { connectInputSchema } from './inputs';
import type { tunnelConfigSchema } from './outputs';

export type ConnectRequest = z.infer<typeof connectInputSchema>;
export type TunnelConfig = z.infer<typeof tunnelConfigSchema>;
```

`index.ts`:

```ts
export { connectInputSchema } from './inputs';
export { tunnelConfigSchema } from './outputs';
export type { ConnectRequest, TunnelConfig } from './types';
```

- [ ] **Step 7: `src/subscription/outputs.ts` + `types.ts` + `index.ts`**

`outputs.ts`:

```ts
import { z } from 'zod';

export const subscriptionStatusSchema = z.object({
  status: z.enum(['active', 'expired', 'canceled']),
  currentPeriodEnd: z.string().nullable(),
});
```

`types.ts`:

```ts
import type { z } from 'zod';
import type { subscriptionStatusSchema } from './outputs';

export type SubscriptionStatus = z.infer<typeof subscriptionStatusSchema>;
```

`index.ts`:

```ts
export { subscriptionStatusSchema } from './outputs';
export type { SubscriptionStatus } from './types';
```

- [ ] **Step 8: `src/index.ts` (корневой баррел)**

```ts
export * from './errors';
export * from './nodes';
export * from './subscription';
export * from './tunnel';
```

- [ ] **Step 9: Написать падающий тест `src/tunnel/tunnel.test.ts`**

```ts
import { describe, expect, it } from 'bun:test';
import { connectInputSchema, tunnelConfigSchema } from './index';

describe('tunnel schemas', () => {
  it('accepts a valid tunnel config', () => {
    const config = {
      privateKey: 'aGVsbG8=',
      address: '10.8.0.2/32',
      dns: '10.8.0.1',
      serverPublicKey: 'c2VydmVy',
      endpoint: 'de.gnomevpn.example:51820',
      allowedIps: ['0.0.0.0/0', '::/0'],
      persistentKeepalive: 25,
    };
    expect(tunnelConfigSchema.parse(config)).toEqual(config);
  });

  it('rejects connect input without nodeId', () => {
    expect(connectInputSchema.safeParse({}).success).toBe(false);
  });

  it('rejects non-uuid nodeId', () => {
    expect(connectInputSchema.safeParse({ nodeId: 'not-a-uuid' }).success).toBe(false);
  });
});
```

- [ ] **Step 10: Прогнать тест — должен пройти (схемы уже написаны)**

Run: `cd c:/Projects/gnomevpn && bun install && bun --filter @gnomevpn/schemas test`
Expected: 3 passing.

- [ ] **Step 11: Typecheck**

Run: `bun --filter @gnomevpn/schemas typecheck`
Expected: без ошибок.

- [ ] **Step 12: Commit**

```bash
git add packages/schemas
git commit -m "feat(schemas): add node, tunnel, subscription, error Zod contracts"
```

---

## Task 3: Backend bootstrap (NestJS + Prisma + env + core)

**Files:**

- Create: `apps/server/package.json`, `apps/server/tsconfig.json`, `apps/server/prisma.config.ts`
- Create: `apps/server/prisma/base.prisma`, `apps/server/prisma/schema/{auth,node,subscription,peer}.prisma`
- Create: `apps/server/src/config/{env.schema.ts,config.module.ts,cors.ts}`
- Create: `apps/server/src/core/{base-prisma.ts,prisma.service.ts,prisma.module.ts,index.ts}`
- Create: `apps/server/src/common/decorators/current-user.decorator.ts`
- Create: `apps/server/src/common/exceptions/{app.exception.ts,index.ts}`
- Create: `apps/server/src/common/filters/all-exceptions.filter.ts`

**Interfaces:**

- Consumes: `@gnomevpn/schemas` (`ApiErrorCode`).
- Produces:
  - `env` (validated) + `AppConfigService.get(key)`.
  - `PrismaService` (DI, `@Global PrismaModule`), `basePrisma` (raw, для better-auth).
  - `@CurrentUser()` → `string` (userId), `@CurrentSession()` → `UserSession`.
  - `AppNotFoundException`, `AppForbiddenException`, `AppUnauthorizedException`, `AppBadRequestException`, `AppPaymentRequiredException`, `AppServiceUnavailableException` (each `(code: ApiErrorCode, error: string)`).
  - `AllExceptionsFilter`.
  - Prisma models: `User`, `Session`, `Account`, `Verification`, `Node`, `Subscription`, `ActivePeer`.

- [ ] **Step 1: `apps/server/package.json`**

```json
{
  "name": "@gnomevpn/server",
  "type": "module",
  "version": "0.1.0",
  "private": true,
  "main": "src/main.ts",
  "scripts": {
    "dev": "bun --hot --cwd ../.. --env-file apps/server/.env apps/server/src/main.ts",
    "start": "bun src/main.ts",
    "db:push": "prisma db push && prisma generate",
    "db:migrate": "prisma migrate dev && prisma generate",
    "db:studio": "prisma studio",
    "db:generate": "prisma generate",
    "typecheck": "tsc --noEmit",
    "test": "bun test",
    "postinstall": "prisma generate"
  },
  "dependencies": {
    "@nestjs/common": "11.1.28",
    "@nestjs/core": "11.1.28",
    "@nestjs/platform-express": "11.1.28",
    "@nestjs/config": "4.0.4",
    "@nestjs/throttler": "^6.4.0",
    "@prisma/client": "^7.8.0",
    "@prisma/adapter-pg": "^7.8.0",
    "pg": "^8.13.0",
    "better-auth": "^1.6.23",
    "@thallesp/nestjs-better-auth": "2.7.0",
    "nestjs-zod": "5.4.0",
    "zod": "^4.4.3",
    "helmet": "^8.0.0",
    "express": "^4.21.0",
    "reflect-metadata": "^0.2.2",
    "remeda": "^2.17.0",
    "@gnomevpn/schemas": "workspace:*"
  },
  "devDependencies": {
    "prisma": "^7.8.0",
    "typescript": "~6.0.3",
    "@types/bun": "latest",
    "@types/express": "^4.17.21"
  }
}
```

- [ ] **Step 2: `apps/server/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "types": ["bun"],
    "noEmit": true
  },
  "include": ["src/**/*.ts", "prisma.config.ts"],
  "exclude": ["node_modules", "generated"]
}
```

- [ ] **Step 3: `apps/server/prisma/base.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../generated"
}

datasource db {
  provider = "postgresql"
}
```

- [ ] **Step 4: `apps/server/prisma.config.ts`**

```ts
import { defineConfig, env } from 'prisma/config';
import 'dotenv/config';

export default defineConfig({
  schema: './prisma',
  migrations: { path: './prisma/migrations' },
  datasource: { url: env('DIRECT_URL') },
});
```

- [ ] **Step 5: `apps/server/prisma/schema/auth.prisma`** (better-auth таблицы)

```prisma
model User {
  id            String    @id @default(dbgenerated("gen_random_uuid()"))
  name          String
  email         String    @unique
  emailVerified Boolean   @default(false) @map("email_verified")
  image         String?
  createdAt     DateTime  @default(now()) @map("created_at") @db.Timestamptz(3)
  updatedAt     DateTime  @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(3)
  sessions      Session[]
  accounts      Account[]
  subscription  Subscription?
  activePeer    ActivePeer?

  @@map("user")
}

model Session {
  id        String   @id @default(dbgenerated("gen_random_uuid()"))
  userId    String   @map("user_id")
  token     String   @unique
  expiresAt DateTime @map("expires_at") @db.Timestamptz(3)
  ipAddress String?  @map("ip_address")
  userAgent String?  @map("user_agent")
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(3)
  updatedAt DateTime @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(3)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("session")
}

model Account {
  id                    String    @id @default(dbgenerated("gen_random_uuid()"))
  userId                String    @map("user_id")
  accountId             String    @map("account_id")
  providerId            String    @map("provider_id")
  accessToken           String?   @map("access_token")
  refreshToken          String?   @map("refresh_token")
  idToken               String?   @map("id_token")
  accessTokenExpiresAt  DateTime? @map("access_token_expires_at") @db.Timestamptz(3)
  refreshTokenExpiresAt DateTime? @map("refresh_token_expires_at") @db.Timestamptz(3)
  scope                 String?
  password              String?
  createdAt             DateTime  @default(now()) @map("created_at") @db.Timestamptz(3)
  updatedAt             DateTime  @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(3)
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("account")
}

model Verification {
  id         String   @id @default(dbgenerated("gen_random_uuid()"))
  identifier String
  value      String
  expiresAt  DateTime @map("expires_at") @db.Timestamptz(3)
  createdAt  DateTime @default(now()) @map("created_at") @db.Timestamptz(3)
  updatedAt  DateTime @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(3)

  @@map("verification")
}
```

- [ ] **Step 6: `apps/server/prisma/schema/node.prisma`**

```prisma
model Node {
  id             String   @id @default(dbgenerated("gen_random_uuid()"))
  country        String
  countryCode    String   @map("country_code")
  flagEmoji      String   @map("flag_emoji")
  city           String?
  wgEasyUrl      String   @map("wg_easy_url")
  wgEasyApiKeyRef String  @map("wg_easy_api_key_ref")
  publicEndpoint String   @map("public_endpoint")
  enabled        Boolean  @default(true)
  sortOrder      Int      @default(0) @map("sort_order")
  lastHealthyAt  DateTime? @map("last_healthy_at") @db.Timestamptz(3)
  createdAt      DateTime @default(now()) @map("created_at") @db.Timestamptz(3)
  activePeers    ActivePeer[]

  @@map("node")
}
```

- [ ] **Step 7: `apps/server/prisma/schema/subscription.prisma`**

```prisma
enum SubscriptionStatus {
  active
  expired
  canceled
}

model Subscription {
  id               String             @id @default(dbgenerated("gen_random_uuid()"))
  userId           String             @unique @map("user_id")
  status           SubscriptionStatus @default(active)
  currentPeriodEnd DateTime?          @map("current_period_end") @db.Timestamptz(3)
  createdAt        DateTime           @default(now()) @map("created_at") @db.Timestamptz(3)
  updatedAt        DateTime           @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(3)
  user             User               @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("subscription")
}
```

- [ ] **Step 8: `apps/server/prisma/schema/peer.prisma`**

```prisma
model ActivePeer {
  id             String   @id @default(dbgenerated("gen_random_uuid()"))
  userId         String   @unique @map("user_id")
  nodeId         String   @map("node_id")
  wgEasyClientId String   @map("wg_easy_client_id")
  assignedIp     String   @map("assigned_ip")
  lastHandshakeAt DateTime? @map("last_handshake_at") @db.Timestamptz(3)
  createdAt      DateTime @default(now()) @map("created_at") @db.Timestamptz(3)
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  node           Node     @relation(fields: [nodeId], references: [id], onDelete: Cascade)

  @@map("active_peer")
}
```

- [ ] **Step 9: `apps/server/src/config/env.schema.ts`**

```ts
import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.url(),
  DIRECT_URL: z.url(),
  BETTER_AUTH_SECRET: z.string().min(1),
  BETTER_AUTH_URL: z.url(),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
});

export type Env = z.infer<typeof envSchema>;

export const validateEnv = (raw: Record<string, unknown>): Env => {
  const parsed = envSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Invalid environment:\n${z.prettifyError(parsed.error)}`);
  }
  return parsed.data;
};
```

- [ ] **Step 10: `apps/server/src/config/cors.ts` + `config.module.ts`**

`cors.ts`:

```ts
import { validateEnv } from './env.schema';

const env = validateEnv(process.env);

export const allowedOrigins = env.CORS_ORIGINS.split(',').map((o) => o.trim());
```

`config.module.ts`:

```ts
import { Global, Injectable, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule, ConfigService } from '@nestjs/config';
import { type Env, validateEnv } from './env.schema';

@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService<Env, true>) {}
  get<K extends keyof Env>(key: K): Env[K] {
    return this.config.get(key, { infer: true });
  }
}

@Global()
@Module({
  imports: [NestConfigModule.forRoot({ isGlobal: true, cache: true, validate: validateEnv })],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class AppConfigModule {}
```

- [ ] **Step 11: `apps/server/src/core/*`**

`base-prisma.ts`:

```ts
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated';
import { validateEnv } from '../config/env.schema';

const env = validateEnv(process.env);

const globalForPrisma = globalThis as unknown as { basePrisma?: PrismaClient };

export const basePrisma =
  globalForPrisma.basePrisma ??
  new PrismaClient({ adapter: new PrismaPg({ connectionString: env.DATABASE_URL }) });

if (env.NODE_ENV === 'development') {
  globalForPrisma.basePrisma = basePrisma;
}
```

`prisma.service.ts`:

```ts
import { Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated';
import { validateEnv } from '../config/env.schema';

const env = validateEnv(process.env);

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      adapter: new PrismaPg({ connectionString: env.DATABASE_URL }),
      log: env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
  }
  async onModuleInit() {
    await this.$connect();
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

`prisma.module.ts`:

```ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({ providers: [PrismaService], exports: [PrismaService] })
export class PrismaModule {}
```

`index.ts`:

```ts
export { basePrisma } from './base-prisma';
export { PrismaModule } from './prisma.module';
export { PrismaService } from './prisma.service';
```

- [ ] **Step 12: `apps/server/src/common/decorators/current-user.decorator.ts`**

```ts
import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { UserSession } from '@thallesp/nestjs-better-auth';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<{ session?: UserSession }>();
    return request.session?.user.id ?? '';
  },
);

export const CurrentSession = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UserSession =>
    ctx.switchToHttp().getRequest<{ session: UserSession }>().session,
);
```

- [ ] **Step 13: `apps/server/src/common/exceptions/app.exception.ts` + `index.ts`**

`app.exception.ts`:

```ts
import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import type { ApiErrorCode } from '@gnomevpn/schemas';

const body = (code: ApiErrorCode, error: string) => ({ error, code });

export class PaymentRequiredException extends HttpException {
  constructor(response: { error: string; code: ApiErrorCode }) {
    super(response, 402);
  }
}

export class AppNotFoundException extends NotFoundException {
  constructor(code: ApiErrorCode, error: string) {
    super(body(code, error));
  }
}
export class AppForbiddenException extends ForbiddenException {
  constructor(code: ApiErrorCode, error: string) {
    super(body(code, error));
  }
}
export class AppUnauthorizedException extends UnauthorizedException {
  constructor(code: ApiErrorCode, error: string) {
    super(body(code, error));
  }
}
export class AppBadRequestException extends BadRequestException {
  constructor(code: ApiErrorCode, error: string) {
    super(body(code, error));
  }
}
export class AppPaymentRequiredException extends PaymentRequiredException {
  constructor(code: ApiErrorCode, error: string) {
    super(body(code, error));
  }
}
export class AppServiceUnavailableException extends ServiceUnavailableException {
  constructor(code: ApiErrorCode, error: string) {
    super(body(code, error));
  }
}
```

`index.ts`:

```ts
export * from './app.exception';
```

- [ ] **Step 14: `apps/server/src/common/filters/all-exceptions.filter.ts`**

```ts
import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      const hasCode = typeof res === 'object' && res !== null && 'code' in res;
      response.status(exception.getStatus()).json(
        hasCode ? res : { error: exception.message, code: 'INTERNAL_ERROR' },
      );
      return;
    }

    this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
}
```

- [ ] **Step 15: Создать `.env` для локали (не коммитить)**

Create `apps/server/.env`:

```
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://gnomevpn:gnomevpn@localhost:5432/gnomevpn
DIRECT_URL=postgresql://gnomevpn:gnomevpn@localhost:5432/gnomevpn
BETTER_AUTH_SECRET=dev-secret-change-me-min-32-chars-000
BETTER_AUTH_URL=http://localhost:4000
CORS_ORIGINS=http://localhost:3000
```

- [ ] **Step 16: Установить зависимости и сгенерить Prisma-клиент**

Run: `cd c:/Projects/gnomevpn && bun install`
Expected: устанавливается; `postinstall` вызывает `prisma generate` (может ругнуться на отсутствие БД — это ок, генерация клиента не требует коннекта).

Если `prisma generate` не отработал в postinstall:
Run: `cd apps/server && bun run db:generate`
Expected: `Generated Prisma Client` в `apps/server/generated`.

- [ ] **Step 17: Typecheck**

Run: `cd c:/Projects/gnomevpn && bun --filter @gnomevpn/server typecheck`
Expected: без ошибок (все импорты `../../generated` резолвятся после генерации).

- [ ] **Step 18: Commit**

```bash
git add apps/server/package.json apps/server/tsconfig.json apps/server/prisma.config.ts apps/server/prisma apps/server/src bun.lock
git commit -m "feat(server): bootstrap NestJS + Prisma schema + core (env, prisma, exceptions)"
```

---

## Task 4: better-auth + auth-модуль

**Files:**

- Create: `apps/server/src/modules/auth/auth.ts`
- Create: `apps/server/src/modules/auth/auth.module.ts`

**Interfaces:**

- Consumes: `basePrisma` (core), `allowedOrigins` (config).
- Produces: `auth` (better-auth instance, `basePath: '/auth'`, email+password, Bearer plugin, создаёт `Subscription` в `databaseHooks.user.create.after`); `AuthModule` (регистрирует глобальный AuthGuard через `BetterAuthModule.forRoot`).

- [ ] **Step 1: `apps/server/src/modules/auth/auth.ts`**

```ts
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { bearer } from 'better-auth/plugins';
import { allowedOrigins } from '../../config/cors';
import { validateEnv } from '../../config/env.schema';
import { basePrisma } from '../../core';

const env = validateEnv(process.env);

export const auth = betterAuth({
  basePath: '/auth',
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: allowedOrigins,
  emailAndPassword: { enabled: true, requireEmailVerification: false },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await basePrisma.subscription.create({
            data: { userId: user.id, status: 'active' },
          });
        },
      },
    },
  },
  plugins: [bearer()],
  database: prismaAdapter(basePrisma, { provider: 'postgresql' }),
});
```

> **Замечание для исполнителя:** на Этапе 1 хук создаёт подписку со `status: 'active'` — это часть заглушки «у всех есть доступ». На Этапе 2 (оплата) этот дефолт меняется на `expired`, а `active` выставляет только вебхук ЮKassa.

- [ ] **Step 2: `apps/server/src/modules/auth/auth.module.ts`**

```ts
import { Module } from '@nestjs/common';
import { AuthModule as BetterAuthModule } from '@thallesp/nestjs-better-auth';
import { auth } from './auth';

@Module({
  imports: [BetterAuthModule.forRoot({ auth, isGlobal: true })],
})
export class AuthModule {}
```

- [ ] **Step 3: Typecheck**

Run: `cd c:/Projects/gnomevpn && bun --filter @gnomevpn/server typecheck`
Expected: без ошибок.

- [ ] **Step 4: Commit**

```bash
git add apps/server/src/modules/auth
git commit -m "feat(server): configure better-auth with subscription bootstrap hook"
```

---

## Task 5: wg-easy REST-клиент (lib)

**Files:**

- Create: `apps/server/src/lib/wg-easy.ts`
- Create: `apps/server/src/lib/index.ts`
- Test: `apps/server/src/lib/wg-easy.test.ts`

**Interfaces:**

- Produces: `WgEasyClient` class:
  - `constructor(opts: { baseUrl: string; apiKey: string })`
  - `createClient(name: string): Promise<{ clientId: string; privateKey: string; address: string; serverPublicKey: string; dns: string }>`
  - `deleteClient(clientId: string): Promise<void>`
  - `getClientHandshake(clientId: string): Promise<Date | null>`
  - `health(): Promise<boolean>`

> **Замечание для исполнителя:** wg-easy REST API отличается по версиям. Здесь — тонкая обёртка над `fetch` с методами, которые нужны оркестратору. Реальные пути эндпоинтов (`/api/wireguard/client` и т.п.) свериться с версией wg-easy при поднятии узла (Task 13); здесь фиксируем контракт обёртки, а URL-пути — единственное, что может потребовать правки под конкретную версию. Тест мокает `fetch`, поэтому не зависит от реального wg-easy.

- [ ] **Step 1: Написать падающий тест `apps/server/src/lib/wg-easy.test.ts`**

```ts
import { afterEach, describe, expect, it, mock } from 'bun:test';
import { WgEasyClient } from './wg-easy';

const makeClient = () => new WgEasyClient({ baseUrl: 'http://wg.local', apiKey: 'k' });

afterEach(() => {
  mock.restore();
});

describe('WgEasyClient', () => {
  it('createClient posts and maps the response', async () => {
    const fetchMock = mock(async () =>
      new Response(
        JSON.stringify({
          id: 'client-1',
          privateKey: 'priv',
          address: '10.8.0.2/32',
          serverPublicKey: 'srvpub',
          dns: '10.8.0.1',
        }),
        { status: 200 },
      ),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const result = await makeClient().createClient('user-1');

    expect(result.clientId).toBe('client-1');
    expect(result.privateKey).toBe('priv');
    expect(fetchMock).toHaveBeenCalled();
  });

  it('health returns false on non-ok response', async () => {
    globalThis.fetch = mock(async () => new Response('', { status: 503 })) as unknown as typeof fetch;
    expect(await makeClient().health()).toBe(false);
  });
});
```

- [ ] **Step 2: Прогнать тест — должен упасть**

Run: `cd c:/Projects/gnomevpn && bun --filter @gnomevpn/server test`
Expected: FAIL — `WgEasyClient` не найден.

- [ ] **Step 3: Реализовать `apps/server/src/lib/wg-easy.ts`**

```ts
type CreateClientResult = {
  clientId: string;
  privateKey: string;
  address: string;
  serverPublicKey: string;
  dns: string;
};

export class WgEasyClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(opts: { baseUrl: string; apiKey: string }) {
    this.baseUrl = opts.baseUrl.replace(/\/$/, '');
    this.apiKey = opts.apiKey;
  }

  private headers(): HeadersInit {
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` };
  }

  async createClient(name: string): Promise<CreateClientResult> {
    const res = await fetch(`${this.baseUrl}/api/wireguard/client`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      throw new Error(`wg-easy createClient failed: ${res.status}`);
    }
    const data = (await res.json()) as {
      id: string;
      privateKey: string;
      address: string;
      serverPublicKey: string;
      dns: string;
    };
    return {
      clientId: data.id,
      privateKey: data.privateKey,
      address: data.address,
      serverPublicKey: data.serverPublicKey,
      dns: data.dns,
    };
  }

  async deleteClient(clientId: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/wireguard/client/${clientId}`, {
      method: 'DELETE',
      headers: this.headers(),
    });
    if (!res.ok && res.status !== 404) {
      throw new Error(`wg-easy deleteClient failed: ${res.status}`);
    }
  }

  async getClientHandshake(clientId: string): Promise<Date | null> {
    const res = await fetch(`${this.baseUrl}/api/wireguard/client/${clientId}`, {
      headers: this.headers(),
    });
    if (!res.ok) {
      return null;
    }
    const data = (await res.json()) as { latestHandshakeAt?: string | null };
    return data.latestHandshakeAt ? new Date(data.latestHandshakeAt) : null;
  }

  async health(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/release`, { headers: this.headers() });
      return res.ok;
    } catch {
      return false;
    }
  }
}
```

- [ ] **Step 4: `apps/server/src/lib/index.ts`**

```ts
export { WgEasyClient } from './wg-easy';
```

- [ ] **Step 5: Прогнать тест — должен пройти**

Run: `cd c:/Projects/gnomevpn && bun --filter @gnomevpn/server test`
Expected: 2 passing (wg-easy) + предыдущие.

- [ ] **Step 6: Commit**

```bash
git add apps/server/src/lib
git commit -m "feat(server): add wg-easy REST client wrapper"
```

---

## Task 6: subscription-модуль + guard (заглушка)

**Files:**

- Create: `apps/server/src/modules/subscription/subscription.service.ts`
- Create: `apps/server/src/modules/subscription/subscription.guard.ts`
- Create: `apps/server/src/modules/subscription/subscription.module.ts`
- Test: `apps/server/src/modules/subscription/subscription.service.test.ts`

**Interfaces:**

- Consumes: `PrismaService`, `@gnomevpn/schemas` (`SubscriptionStatus`).
- Produces:
  - `SubscriptionService.hasActiveAccess(userId: string): Promise<boolean>` — на Этапе 1 всегда `true` (заглушка).
  - `SubscriptionService.getStatus(userId: string): Promise<SubscriptionStatus>` — читает БД.
  - `SubscriptionGuard` (Nest `CanActivate`) — на Этапе 1 всегда пропускает; интерфейс на месте.

- [ ] **Step 1: Написать падающий тест `subscription.service.test.ts`**

```ts
import { describe, expect, it } from 'bun:test';
import { SubscriptionService } from './subscription.service';

const fakePrisma = {
  subscription: {
    findUnique: async () => ({ status: 'active', currentPeriodEnd: null }),
  },
} as never;

describe('SubscriptionService (stage 1 stub)', () => {
  it('hasActiveAccess always returns true', async () => {
    const service = new SubscriptionService(fakePrisma);
    expect(await service.hasActiveAccess('any-user')).toBe(true);
  });

  it('getStatus maps db row', async () => {
    const service = new SubscriptionService(fakePrisma);
    const status = await service.getStatus('any-user');
    expect(status.status).toBe('active');
  });
});
```

- [ ] **Step 2: Прогнать — упадёт**

Run: `cd c:/Projects/gnomevpn && bun --filter @gnomevpn/server test`
Expected: FAIL — `SubscriptionService` не найден.

- [ ] **Step 3: `subscription.service.ts`**

```ts
import { Injectable } from '@nestjs/common';
import type { SubscriptionStatus } from '@gnomevpn/schemas';
import { PrismaService } from '../../core';

@Injectable()
export class SubscriptionService {
  constructor(private readonly prisma: PrismaService) {}

  async hasActiveAccess(_userId: string): Promise<boolean> {
    return true;
  }

  async getStatus(userId: string): Promise<SubscriptionStatus> {
    const row = await this.prisma.subscription.findUnique({
      where: { userId },
      select: { status: true, currentPeriodEnd: true },
    });
    if (!row) {
      return { status: 'expired', currentPeriodEnd: null };
    }
    return {
      status: row.status,
      currentPeriodEnd: row.currentPeriodEnd ? row.currentPeriodEnd.toISOString() : null,
    };
  }
}
```

- [ ] **Step 4: `subscription.guard.ts`**

```ts
import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { AppPaymentRequiredException } from '../../common/exceptions';
import { SubscriptionService } from './subscription.service';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(private readonly subscription: SubscriptionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ session?: UserSession }>();
    const userId = request.session?.user.id ?? '';
    const hasAccess = await this.subscription.hasActiveAccess(userId);
    if (!hasAccess) {
      throw new AppPaymentRequiredException('PAYMENT_REQUIRED', 'Active subscription required');
    }
    return true;
  }
}
```

- [ ] **Step 5: `subscription.module.ts`**

```ts
import { Module } from '@nestjs/common';
import { SubscriptionGuard } from './subscription.guard';
import { SubscriptionService } from './subscription.service';

@Module({
  providers: [SubscriptionService, SubscriptionGuard],
  exports: [SubscriptionService, SubscriptionGuard],
})
export class SubscriptionModule {}
```

- [ ] **Step 6: Прогнать — пройдёт**

Run: `cd c:/Projects/gnomevpn && bun --filter @gnomevpn/server test`
Expected: 2 passing (subscription) + предыдущие.

- [ ] **Step 7: Commit**

```bash
git add apps/server/src/modules/subscription
git commit -m "feat(server): add subscription service + guard (stage 1 stub always allows)"
```

---

## Task 7: nodes-модуль (список стран)

**Files:**

- Create: `apps/server/src/modules/nodes/dto/nodes.dto.ts`
- Create: `apps/server/src/modules/nodes/nodes.service.ts`
- Create: `apps/server/src/modules/nodes/nodes.controller.ts`
- Create: `apps/server/src/modules/nodes/nodes.module.ts`
- Test: `apps/server/src/modules/nodes/nodes.service.test.ts`

**Interfaces:**

- Consumes: `PrismaService`, `WgEasyClient` (lib), `nodeSchema` (`@gnomevpn/schemas`).
- Produces:
  - `NodesService.listPublicNodes(): Promise<Node[]>` — только `enabled`, публичные поля.
  - `NodesService.getNodeForConnect(nodeId: string): Promise<{ id, publicEndpoint, wgEasyUrl, wgEasyApiKeyRef }>` — внутренние поля для оркестратора; кидает `AppNotFoundException('NODE_NOT_FOUND')` если нет/disabled.
  - `GET /nodes` → `Node[]`.

- [ ] **Step 1: Написать падающий тест `nodes.service.test.ts`**

```ts
import { describe, expect, it } from 'bun:test';
import { NodesService } from './nodes.service';

const rows = [
  { id: 'n1', country: 'Germany', countryCode: 'DE', flagEmoji: '🇩🇪', city: 'Frankfurt', enabled: true },
];

const fakePrisma = {
  node: {
    findMany: async () => rows,
    findFirst: async ({ where }: { where: { id: string; enabled: boolean } }) =>
      where.id === 'n1'
        ? { id: 'n1', publicEndpoint: 'de:51820', wgEasyUrl: 'http://wg', wgEasyApiKeyRef: 'REF' }
        : null,
  },
} as never;

describe('NodesService', () => {
  it('listPublicNodes returns only public fields', async () => {
    const service = new NodesService(fakePrisma);
    const nodes = await service.listPublicNodes();
    expect(nodes).toHaveLength(1);
    expect(nodes[0]).not.toHaveProperty('wgEasyUrl');
    expect(nodes[0].country).toBe('Germany');
  });

  it('getNodeForConnect throws for unknown node', async () => {
    const service = new NodesService(fakePrisma);
    await expect(service.getNodeForConnect('nope')).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Прогнать — упадёт**

Run: `cd c:/Projects/gnomevpn && bun --filter @gnomevpn/server test`
Expected: FAIL — `NodesService` не найден.

- [ ] **Step 3: `nodes.service.ts`**

```ts
import { Injectable } from '@nestjs/common';
import type { Node } from '@gnomevpn/schemas';
import { AppNotFoundException } from '../../common/exceptions';
import { PrismaService } from '../../core';

@Injectable()
export class NodesService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublicNodes(): Promise<Node[]> {
    const rows = await this.prisma.node.findMany({
      where: { enabled: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, country: true, countryCode: true, flagEmoji: true, city: true },
    });
    return rows.map((r) => ({
      id: r.id,
      country: r.country,
      countryCode: r.countryCode,
      flagEmoji: r.flagEmoji,
      city: r.city ?? undefined,
    }));
  }

  async getNodeForConnect(nodeId: string) {
    const node = await this.prisma.node.findFirst({
      where: { id: nodeId, enabled: true },
      select: { id: true, publicEndpoint: true, wgEasyUrl: true, wgEasyApiKeyRef: true },
    });
    if (!node) {
      throw new AppNotFoundException('NODE_NOT_FOUND', 'Node not found');
    }
    return node;
  }
}
```

- [ ] **Step 4: `dto/nodes.dto.ts`**

```ts
import { nodeSchema } from '@gnomevpn/schemas';
import { createZodDto } from 'nestjs-zod';

export class NodeDto extends createZodDto(nodeSchema) {}
```

- [ ] **Step 5: `nodes.controller.ts`**

```ts
import { Controller, Get } from '@nestjs/common';
import { ZodResponse } from 'nestjs-zod';
import { NodeDto } from './dto/nodes.dto';
import { NodesService } from './nodes.service';

@Controller('nodes')
export class NodesController {
  constructor(private readonly nodes: NodesService) {}

  @Get()
  @ZodResponse({ type: [NodeDto] })
  listNodes() {
    return this.nodes.listPublicNodes();
  }
}
```

- [ ] **Step 6: `nodes.module.ts`**

```ts
import { Module } from '@nestjs/common';
import { NodesController } from './nodes.controller';
import { NodesService } from './nodes.service';

@Module({
  controllers: [NodesController],
  providers: [NodesService],
  exports: [NodesService],
})
export class NodesModule {}
```

- [ ] **Step 7: Прогнать — пройдёт**

Run: `cd c:/Projects/gnomevpn && bun --filter @gnomevpn/server test`
Expected: 2 passing (nodes) + предыдущие.

- [ ] **Step 8: Commit**

```bash
git add apps/server/src/modules/nodes
git commit -m "feat(server): add nodes module (GET /nodes, connect lookup)"
```

---

## Task 8: tunnel-модуль (оркестратор connect/disconnect)

**Files:**

- Create: `apps/server/src/modules/tunnel/dto/tunnel.dto.ts`
- Create: `apps/server/src/modules/tunnel/tunnel.service.ts`
- Create: `apps/server/src/modules/tunnel/tunnel.controller.ts`
- Create: `apps/server/src/modules/tunnel/tunnel.module.ts`
- Test: `apps/server/src/modules/tunnel/tunnel.service.test.ts`

**Interfaces:**

- Consumes: `PrismaService`, `NodesService`, `AppConfigService`, `WgEasyClient` (lib), `tunnelConfigSchema`/`connectInputSchema` (`@gnomevpn/schemas`), `AppServiceUnavailableException`.
- Produces:
  - `TunnelService.connect(userId, nodeId): Promise<TunnelConfig>` — снимает старый пир (single-connection), создаёт нового через wg-easy, пишет `ActivePeer`, возвращает `TunnelConfig`.
  - `TunnelService.disconnect(userId): Promise<void>` — удаляет пира на wg-easy + `ActivePeer`; идемпотентно.
  - `POST /tunnel/connect` (guarded `SubscriptionGuard`) → `TunnelConfig`.
  - `POST /tunnel/disconnect` → 204.

> **Замечание для исполнителя:** `wgEasyApiKeyRef` в БД — это ИМЯ env-переменной с ключом (секрет не в БД). Сервис читает реальный ключ из `process.env[node.wgEasyApiKeyRef]`. Для локали в `.env` кладётся, например, `WG_EASY_KEY_DE=...`, а в записи Node `wgEasyApiKeyRef = "WG_EASY_KEY_DE"`.
> **Замечание про тест:** `makeWgClient` — публичный метод сервиса именно для того, чтобы тест мог подменить его на фейковый wg-клиент (seam для мокинга). В тесте он переопределяется стрелкой, игнорирующей аргументы — это валидно, реальная сигнатура `makeWgClient(baseUrl, apiKey)`.

- [ ] **Step 1: Написать падающий тест `tunnel.service.test.ts`**

```ts
import { describe, expect, it, mock } from 'bun:test';
import { TunnelService } from './tunnel.service';

const node = { id: 'n1', publicEndpoint: 'de:51820', wgEasyUrl: 'http://wg', wgEasyApiKeyRef: 'WG_KEY' };

const makeDeps = (existingPeer: unknown) => {
  const deleteClient = mock(async () => {});
  const createClient = mock(async () => ({
    clientId: 'c1',
    privateKey: 'priv',
    address: '10.8.0.2/32',
    serverPublicKey: 'srvpub',
    dns: '10.8.0.1',
  }));

  const prisma = {
    activePeer: {
      findUnique: mock(async () => existingPeer),
      delete: mock(async () => {}),
      upsert: mock(async () => ({})),
      create: mock(async () => ({})),
    },
    node: { findUnique: mock(async () => ({ wgEasyUrl: node.wgEasyUrl, wgEasyApiKeyRef: node.wgEasyApiKeyRef })) },
  } as never;

  const nodes = { getNodeForConnect: mock(async () => node) } as never;
  const config = { get: () => 'development' } as never;

  return { prisma, nodes, config, createClient, deleteClient };
};

describe('TunnelService.connect', () => {
  it('creates a peer and returns a tunnel config', async () => {
    process.env.WG_KEY = 'secret';
    const { prisma, nodes, config, createClient, deleteClient } = makeDeps(null);
    const service = new TunnelService(prisma, nodes, config);
    service.makeWgClient = () => ({ createClient, deleteClient }) as never;

    const cfg = await service.connect('user-1', 'n1');

    expect(cfg.endpoint).toBe('de:51820');
    expect(cfg.privateKey).toBe('priv');
    expect(cfg.allowedIps).toContain('0.0.0.0/0');
    expect(createClient).toHaveBeenCalled();
  });

  it('removes an existing peer before creating a new one', async () => {
    process.env.WG_KEY = 'secret';
    const existing = { wgEasyClientId: 'old', nodeId: 'n0' };
    const { prisma, nodes, config, createClient, deleteClient } = makeDeps(existing);
    const service = new TunnelService(prisma, nodes, config);
    service.makeWgClient = () => ({ createClient, deleteClient }) as never;

    await service.connect('user-1', 'n1');

    expect(deleteClient).toHaveBeenCalledWith('old');
  });
});
```

- [ ] **Step 2: Прогнать — упадёт**

Run: `cd c:/Projects/gnomevpn && bun --filter @gnomevpn/server test`
Expected: FAIL — `TunnelService` не найден.

- [ ] **Step 3: `tunnel.service.ts`**

```ts
import { Injectable } from '@nestjs/common';
import type { TunnelConfig } from '@gnomevpn/schemas';
import { AppServiceUnavailableException } from '../../common/exceptions';
import { AppConfigService } from '../../config/config.module';
import { PrismaService } from '../../core';
import { WgEasyClient } from '../../lib';
import { NodesService } from '../nodes/nodes.service';

const ALLOWED_IPS = ['0.0.0.0/0', '::/0'];
const KEEPALIVE = 25;

@Injectable()
export class TunnelService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly nodes: NodesService,
    private readonly config: AppConfigService,
  ) {}

  makeWgClient(baseUrl: string, apiKey: string): WgEasyClient {
    return new WgEasyClient({ baseUrl, apiKey });
  }

  private resolveApiKey(ref: string): string {
    const key = process.env[ref];
    if (!key) {
      throw new AppServiceUnavailableException('NODE_UNAVAILABLE', 'Node credentials missing');
    }
    return key;
  }

  async connect(userId: string, nodeId: string): Promise<TunnelConfig> {
    const node = await this.nodes.getNodeForConnect(nodeId);
    const apiKey = this.resolveApiKey(node.wgEasyApiKeyRef);
    const wg = this.makeWgClient(node.wgEasyUrl, apiKey);

    const existing = await this.prisma.activePeer.findUnique({ where: { userId } });
    if (existing) {
      const oldNode = await this.prisma.node.findUnique({
        where: { id: existing.nodeId },
        select: { wgEasyUrl: true, wgEasyApiKeyRef: true },
      });
      if (oldNode) {
        const oldWg = this.makeWgClient(oldNode.wgEasyUrl, this.resolveApiKey(oldNode.wgEasyApiKeyRef));
        await oldWg.deleteClient(existing.wgEasyClientId).catch(() => undefined);
      }
      await this.prisma.activePeer.delete({ where: { userId } });
    }

    const created = await wg.createClient(userId);

    await this.prisma.activePeer.create({
      data: {
        userId,
        nodeId,
        wgEasyClientId: created.clientId,
        assignedIp: created.address,
      },
    });

    return {
      privateKey: created.privateKey,
      address: created.address,
      dns: created.dns,
      serverPublicKey: created.serverPublicKey,
      endpoint: node.publicEndpoint,
      allowedIps: ALLOWED_IPS,
      persistentKeepalive: KEEPALIVE,
    };
  }

  async disconnect(userId: string): Promise<void> {
    const existing = await this.prisma.activePeer.findUnique({ where: { userId } });
    if (!existing) {
      return;
    }
    const node = await this.prisma.node.findUnique({
      where: { id: existing.nodeId },
      select: { wgEasyUrl: true, wgEasyApiKeyRef: true },
    });
    if (node) {
      const wg = this.makeWgClient(node.wgEasyUrl, this.resolveApiKey(node.wgEasyApiKeyRef));
      await wg.deleteClient(existing.wgEasyClientId).catch(() => undefined);
    }
    await this.prisma.activePeer.delete({ where: { userId } });
  }
}
```

- [ ] **Step 4: `dto/tunnel.dto.ts`**

```ts
import { connectInputSchema, tunnelConfigSchema } from '@gnomevpn/schemas';
import { createZodDto } from 'nestjs-zod';

export class ConnectDto extends createZodDto(connectInputSchema) {}
export class TunnelConfigDto extends createZodDto(tunnelConfigSchema) {}
```

- [ ] **Step 5: `tunnel.controller.ts`**

```ts
import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ZodResponse } from 'nestjs-zod';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SubscriptionGuard } from '../subscription/subscription.guard';
import { ConnectDto, TunnelConfigDto } from './dto/tunnel.dto';
import { TunnelService } from './tunnel.service';

@Controller('tunnel')
export class TunnelController {
  constructor(private readonly tunnel: TunnelService) {}

  @Post('connect')
  @UseGuards(SubscriptionGuard)
  @ZodResponse({ type: TunnelConfigDto })
  connect(@Body() body: ConnectDto, @CurrentUser() userId: string) {
    return this.tunnel.connect(userId, body.nodeId);
  }

  @Post('disconnect')
  @HttpCode(204)
  async disconnect(@CurrentUser() userId: string) {
    await this.tunnel.disconnect(userId);
  }
}
```

- [ ] **Step 6: `tunnel.module.ts`**

```ts
import { Module } from '@nestjs/common';
import { NodesModule } from '../nodes/nodes.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { TunnelController } from './tunnel.controller';
import { TunnelService } from './tunnel.service';

@Module({
  imports: [NodesModule, SubscriptionModule],
  controllers: [TunnelController],
  providers: [TunnelService],
})
export class TunnelModule {}
```

- [ ] **Step 7: Прогнать — пройдёт**

Run: `cd c:/Projects/gnomevpn && bun --filter @gnomevpn/server test`
Expected: 2 passing (tunnel) + предыдущие.

- [ ] **Step 8: Commit**

```bash
git add apps/server/src/modules/tunnel
git commit -m "feat(server): add tunnel orchestrator (connect/disconnect via wg-easy)"
```

---

## Task 9: subscription-контроллер (статус) + сборка `app.module.ts` + `main.ts`

**Files:**

- Create: `apps/server/src/modules/subscription/subscription.controller.ts`
- Modify: `apps/server/src/modules/subscription/subscription.module.ts` (добавить controller)
- Create: `apps/server/src/app.module.ts`
- Create: `apps/server/src/main.ts`

**Interfaces:**

- Consumes: все модули выше.
- Produces:
  - `GET /subscription/status` → `SubscriptionStatus`.
  - Работающий HTTP-сервер на `env.PORT` с better-auth на `/auth`, глобальными `ZodValidationPipe`, `AllExceptionsFilter`, CORS.

- [ ] **Step 1: `subscription.controller.ts`**

```ts
import { Controller, Get } from '@nestjs/common';
import { subscriptionStatusSchema } from '@gnomevpn/schemas';
import { createZodDto, ZodResponse } from 'nestjs-zod';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SubscriptionService } from './subscription.service';

class SubscriptionStatusDto extends createZodDto(subscriptionStatusSchema) {}

@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscription: SubscriptionService) {}

  @Get('status')
  @ZodResponse({ type: SubscriptionStatusDto })
  getStatus(@CurrentUser() userId: string) {
    return this.subscription.getStatus(userId);
  }
}
```

- [ ] **Step 2: Обновить `subscription.module.ts`**

```ts
import { Module } from '@nestjs/common';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionGuard } from './subscription.guard';
import { SubscriptionService } from './subscription.service';

@Module({
  controllers: [SubscriptionController],
  providers: [SubscriptionService, SubscriptionGuard],
  exports: [SubscriptionService, SubscriptionGuard],
})
export class SubscriptionModule {}
```

- [ ] **Step 3: `app.module.ts`**

```ts
import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { AppConfigModule } from './config/config.module';
import { PrismaModule } from './core';
import { AuthModule } from './modules/auth/auth.module';
import { NodesModule } from './modules/nodes/nodes.module';
import { SubscriptionModule } from './modules/subscription/subscription.module';
import { TunnelModule } from './modules/tunnel/tunnel.module';

@Module({
  imports: [
    AppConfigModule,
    PrismaModule,
    ThrottlerModule.forRoot({ throttlers: [{ name: 'default', ttl: 60_000, limit: 120 }] }),
    AuthModule,
    SubscriptionModule,
    NodesModule,
    TunnelModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
```

- [ ] **Step 4: `main.ts`**

```ts
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { json } from 'express';
import helmet from 'helmet';
import { ZodValidationPipe } from 'nestjs-zod';
import { AppModule } from './app.module';
import { allowedOrigins } from './config/cors';
import { validateEnv } from './config/env.schema';

const env = validateEnv(process.env);

const app = await NestFactory.create(AppModule, { bodyParser: false });

app.use(helmet({ contentSecurityPolicy: false }));
app.enableCors({ origin: allowedOrigins, credentials: true, exposedHeaders: ['set-auth-token'] });
app.use(json());
app.useGlobalPipes(new ZodValidationPipe());
app.enableShutdownHooks();

await app.listen(env.PORT);
```

- [ ] **Step 5: Поднять Postgres и применить схему**

Run: `cd c:/Projects/gnomevpn && docker compose -f docker-compose.dev.yml up -d postgres` (создаётся в Task 12; если ещё не создан — поднять любой локальный Postgres на 5432 с базой `gnomevpn`)
Then: `cd apps/server && bun run db:push`
Expected: `Your database is now in sync with your Prisma schema`.

- [ ] **Step 6: Запустить сервер и проверить `/nodes`**

Run (терминал 1): `cd c:/Projects/gnomevpn && bun --filter @gnomevpn/server dev`
Run (терминал 2): `curl http://localhost:4000/nodes`
Expected: `[]` (узлов ещё нет) со статусом 200 — сервер жив, роут работает.

- [ ] **Step 7: Проверить регистрацию через better-auth**

Run: `curl -X POST http://localhost:4000/auth/sign-up/email -H "Content-Type: application/json" -d '{"email":"a@b.com","password":"password123","name":"A"}'`
Expected: 200 с телом сессии/пользователя и заголовком `set-auth-token`; в БД появилась строка `user` + `subscription`.

- [ ] **Step 8: Typecheck + commit**

Run: `cd c:/Projects/gnomevpn && bun --filter @gnomevpn/server typecheck`
Expected: без ошибок.

```bash
git add apps/server/src
git commit -m "feat(server): wire app module, main bootstrap, subscription status endpoint"
```

---

## Task 10: Tauri bootstrap (пустая оболочка, компилируется)

**Files:**

- Create: `apps/tauri/package.json`, `apps/tauri/Cargo.toml`, `apps/tauri/build.rs`
- Create: `apps/tauri/tauri.conf.json`, `apps/tauri/capabilities/default.json`
- Create: `apps/tauri/src/main.rs`, `apps/tauri/src/lib.rs`

**Interfaces:**

- Produces: собираемая Tauri-оболочка (`gnomevpn_lib::run()`), которая грузит клиента с `/app`. Пока без VPN-команд.

> **Замечание:** как в Chatovo, Rust-корень — это сам `apps/tauri/` (папки `src-tauri/` нет).

- [ ] **Step 1: `apps/tauri/package.json`**

```json
{
  "name": "@gnomevpn/tauri",
  "type": "module",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "tauri": "tauri",
    "dev": "tauri dev",
    "build": "tauri build",
    "info": "tauri info"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^2"
  }
}
```

- [ ] **Step 2: `apps/tauri/Cargo.toml`**

```toml
[package]
name = "gnomevpn"
version = "0.1.0"
description = "GnomeVPN VPN desktop client"
authors = ["GnomeVPN"]
edition = "2021"

[lib]
name = "gnomevpn_lib"
crate-type = ["staticlib", "cdylib", "rlib"]

[build-dependencies]
tauri-build = { version = "2", features = [] }

[dependencies]
tauri = { version = "2", features = [] }
tauri-plugin-opener = "2"
tauri-plugin-os = "2"
tauri-plugin-process = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
thiserror = "2"

boringtun = "0.6"
tun-rs = { version = "2", features = ["async_tokio"] }
x25519-dalek = { version = "2", features = ["static_secrets"] }
base64 = "0.22"
tokio = { version = "1", features = ["rt-multi-thread", "macros", "net", "sync", "time", "io-util"] }
parking_lot = "0.12"

[target.'cfg(not(any(target_os = "android", target_os = "ios")))'.dependencies]
tauri-plugin-single-instance = "2"
```

> **Замечание для исполнителя:** версии крейтов свериться на crates.io при первой сборке (`cargo add` подберёт совместимые). `boringtun` предоставляет `boringtun::noise::{Tunn, TunnResult}`. `tun-rs` даёт async TUN-устройство. Если конкретная версия `boringtun` окажется `0.7.x` с изменённым путём модуля — поправить `use` в engine.rs (Task 11), контракт функций не меняется.

- [ ] **Step 3: `apps/tauri/build.rs`**

```rust
fn main() {
    tauri_build::build();
}
```

- [ ] **Step 4: `apps/tauri/tauri.conf.json`**

```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "GnomeVPN",
  "version": "0.1.0",
  "identifier": "app.gnomevpn.desktop",
  "build": {
    "frontendDist": "../client/out",
    "devUrl": "http://localhost:3000",
    "beforeBuildCommand": "bun --filter @gnomevpn/client build",
    "beforeDevCommand": "bun --filter @gnomevpn/client dev"
  },
  "app": {
    "windows": [
      {
        "label": "main",
        "title": "GnomeVPN",
        "url": "/app",
        "width": 420,
        "height": 720,
        "center": true,
        "resizable": true,
        "minWidth": 380,
        "minHeight": 640
      }
    ],
    "security": { "csp": null }
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": ["icons/32x32.png", "icons/128x128.png", "icons/icon.ico", "icons/icon.icns"]
  }
}
```

> **Замечание:** иконки генерируются позже (`tauri icon`); для `tauri dev` они не обязательны. Если `dev` ругается на отсутствие иконок — временно убрать блок `bundle.icon` или сгенерить дефолтные.

- [ ] **Step 5: `apps/tauri/capabilities/default.json`**

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Capability for the main window",
  "windows": ["main"],
  "permissions": ["core:default", "opener:default", "os:default", "process:default"]
}
```

- [ ] **Step 6: `apps/tauri/src/main.rs`**

```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    gnomevpn_lib::run()
}
```

- [ ] **Step 7: `apps/tauri/src/lib.rs` (пока без VPN-команд)**

```rust
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default();

    #[cfg(not(any(target_os = "android", target_os = "ios")))]
    let builder = builder.plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
        use tauri::Manager;
        if let Some(window) = app.get_webview_window("main") {
            let _ = window.set_focus();
        }
    }));

    builder
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_process::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

- [ ] **Step 8: Проверить компиляцию Rust (без запуска dev)**

Run: `cd apps/tauri && cargo build`
Expected: скачивает крейты и компилируется без ошибок (клиент ещё не собран, но Rust компилируется независимо; `generate_context!` требует `tauri.conf.json` — он есть).

> Если `cargo` ругается, что `frontendDist ../client/out` не существует — это только для `tauri build`, не для `cargo build`. Игнорировать до Task 12.

- [ ] **Step 9: Commit**

```bash
git add apps/tauri/package.json apps/tauri/Cargo.toml apps/tauri/build.rs apps/tauri/tauri.conf.json apps/tauri/capabilities apps/tauri/src apps/tauri/Cargo.lock
git commit -m "feat(tauri): bootstrap desktop shell loading /app"
```

---

## Task 11: VPN-движок в Rust — типы, декодирование ключей, состояние

**Files:**

- Create: `apps/tauri/src/vpn/mod.rs`
- Create: `apps/tauri/src/vpn/types.rs`
- Create: `apps/tauri/src/vpn/state.rs`

**Interfaces:**

- Produces:
  - `TunnelConfig` (serde Deserialize, зеркалит Zod `tunnelConfigSchema`): `private_key`, `address`, `dns`, `server_public_key`, `endpoint`, `allowed_ips: Vec<String>`, `persistent_keepalive: u16`. **serde-переименование в camelCase** (Tauri шлёт JS-camelCase).
  - `VpnEvent` (serde Serialize, `#[serde(tag = "type")]`): `Connecting`, `Handshake`, `Connected { assigned_ip }`, `BytesUpdate { rx, tx }`, `Disconnected`, `Error { message }`.
  - `VpnStatus` enum: `Disconnected`, `Connecting`, `Connected`.
  - `VpnState` (managed): `Mutex<VpnRuntime>` где `VpnRuntime { status: VpnStatus, stop: Option<oneshot::Sender<()>> }`.
  - `parse_keys(config) -> Result<(StaticSecret, PublicKey), VpnError>` — base64 → dalek-типы.
  - `VpnError` (thiserror, Serialize).

- [ ] **Step 1: `apps/tauri/src/vpn/types.rs`**

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TunnelConfig {
    pub private_key: String,
    pub address: String,
    pub dns: String,
    pub server_public_key: String,
    pub endpoint: String,
    pub allowed_ips: Vec<String>,
    pub persistent_keepalive: u16,
}

#[derive(Debug, Clone, Serialize)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum VpnEvent {
    Connecting,
    Handshake,
    Connected { assigned_ip: String },
    BytesUpdate { rx: u64, tx: u64 },
    Disconnected,
    Error { message: String },
}

#[derive(Debug, thiserror::Error)]
pub enum VpnError {
    #[error("invalid base64 key: {0}")]
    KeyDecode(String),
    #[error("invalid key length")]
    KeyLength,
    #[error("invalid endpoint: {0}")]
    Endpoint(String),
    #[error("tun device error: {0}")]
    Tun(String),
    #[error("io error: {0}")]
    Io(String),
    #[error("already connected")]
    AlreadyConnected,
}

impl serde::Serialize for VpnError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::ser::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}
```

- [ ] **Step 2: `apps/tauri/src/vpn/state.rs`**

```rust
use parking_lot::Mutex;
use tokio::sync::oneshot;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum VpnStatus {
    Disconnected,
    Connecting,
    Connected,
}

pub struct VpnRuntime {
    pub status: VpnStatus,
    pub stop: Option<oneshot::Sender<()>>,
}

impl Default for VpnRuntime {
    fn default() -> Self {
        Self { status: VpnStatus::Disconnected, stop: None }
    }
}

pub struct VpnState(pub Mutex<VpnRuntime>);

impl Default for VpnState {
    fn default() -> Self {
        Self(Mutex::new(VpnRuntime::default()))
    }
}
```

- [ ] **Step 3: `apps/tauri/src/vpn/mod.rs` (частично — модули + parse_keys)**

```rust
pub mod commands;
pub mod engine;
pub mod state;
pub mod types;

use base64::{engine::general_purpose::STANDARD, Engine};
use types::{TunnelConfig, VpnError};
use x25519_dalek::{PublicKey, StaticSecret};

pub fn parse_keys(config: &TunnelConfig) -> Result<(StaticSecret, PublicKey), VpnError> {
    let priv_bytes = decode_key(&config.private_key)?;
    let pub_bytes = decode_key(&config.server_public_key)?;
    Ok((StaticSecret::from(priv_bytes), PublicKey::from(pub_bytes)))
}

fn decode_key(value: &str) -> Result<[u8; 32], VpnError> {
    let raw = STANDARD
        .decode(value.trim())
        .map_err(|e| VpnError::KeyDecode(e.to_string()))?;
    let arr: [u8; 32] = raw.try_into().map_err(|_| VpnError::KeyLength)?;
    Ok(arr)
}
```

- [ ] **Step 4: Проверить компиляцию (engine.rs/commands.rs ещё нет — временно закомментировать их в mod.rs)**

Временно в `mod.rs` закомментируй `pub mod commands;` и `pub mod engine;`, затем:
Run: `cd apps/tauri && cargo build`
Expected: типы и `parse_keys` компилируются. Верни строки обратно после Task 12.

- [ ] **Step 5: Написать тест декодирования ключей `apps/tauri/src/vpn/mod.rs` (в конце файла)**

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn decodes_valid_32_byte_key() {
        let key = STANDARD.encode([7u8; 32]);
        let decoded = decode_key(&key).unwrap();
        assert_eq!(decoded, [7u8; 32]);
    }

    #[test]
    fn rejects_wrong_length_key() {
        let key = STANDARD.encode([1u8; 16]);
        assert!(matches!(decode_key(&key), Err(VpnError::KeyLength)));
    }
}
```

Run: `cd apps/tauri && cargo test vpn::tests`
Expected: 2 passing.

- [ ] **Step 6: Commit**

```bash
git add apps/tauri/src/vpn
git commit -m "feat(tauri): add vpn types, state, and key decoding"
```

---

## Task 12: VPN-движок — туннель (boringtun + tun-rs + маршруты)

**Files:**

- Create: `apps/tauri/src/vpn/engine.rs`

**Interfaces:**

- Consumes: `TunnelConfig`, `VpnEvent`, `VpnError`, `parse_keys`.
- Produces:
  - `async fn run_tunnel(config: TunnelConfig, emit: impl Fn(VpnEvent), stop: oneshot::Receiver<()>) -> Result<(), VpnError>` — поднимает TUN, гоняет boringtun-цикл до сигнала stop, при выходе снимает маршруты.

> **Ключевая механика (изучено из boringtun API):**
> - `Tunn::new(static_private, peer_static_public, None, Some(keepalive), 0, None)` создаёт стейт.
> - Цикл: читаем из TUN → `tunn.encapsulate(packet, &mut buf)` → на `TunnResult::WriteToNetwork(b)` шлём `b` в UDP-сокет сервера.
> - Читаем из UDP → `tunn.decapsulate(None, datagram, &mut buf)` → на `WriteToNetwork(b)` шлём обратно в UDP (handshake-ответы), на `WriteToTunnelV4/V6(b, _)` пишем `b` в TUN.
> - По таймеру (каждые ~250мс) `tunn.update_timers(&mut buf)` → `WriteToNetwork` шлём в UDP (keepalive/retry).
> - Первый успешный `WriteToTunnel*` = соединение живо → эмитим `Connected`.

- [ ] **Step 1: Реализовать `engine.rs`**

```rust
use std::net::ToSocketAddrs;
use std::sync::Arc;

use boringtun::noise::{Tunn, TunnResult};
use tokio::net::UdpSocket;
use tokio::sync::oneshot;
use tokio::time::{interval, Duration};
use tun_rs::AsyncDevice;

use super::types::{TunnelConfig, VpnError, VpnEvent};
use super::{parse_keys, route};

const MAX_PACKET: usize = 65535;

pub async fn run_tunnel(
    config: TunnelConfig,
    emit: Arc<dyn Fn(VpnEvent) + Send + Sync>,
    mut stop: oneshot::Receiver<()>,
) -> Result<(), VpnError> {
    emit(VpnEvent::Connecting);

    let (static_private, server_public) = parse_keys(&config)?;
    let keepalive = if config.persistent_keepalive == 0 { None } else { Some(config.persistent_keepalive) };

    let mut tunn = Tunn::new(static_private, server_public, None, keepalive, 0, None)
        .map_err(|e| VpnError::Io(format!("tunn init: {e:?}")))?;

    let endpoint = config
        .endpoint
        .to_socket_addrs()
        .map_err(|e| VpnError::Endpoint(e.to_string()))?
        .next()
        .ok_or_else(|| VpnError::Endpoint("no address".into()))?;

    let socket = UdpSocket::bind("0.0.0.0:0").await.map_err(|e| VpnError::Io(e.to_string()))?;
    socket.connect(endpoint).await.map_err(|e| VpnError::Io(e.to_string()))?;

    let dev = tun_rs::DeviceBuilder::new()
        .name("gnomevpn0")
        .ipv4(parse_cidr(&config.address)?, 32, None)
        .mtu(1420)
        .build_async()
        .map_err(|e| VpnError::Tun(e.to_string()))?;

    route::apply_default_route("gnomevpn0", endpoint.ip(), &config.dns)
        .map_err(|e| VpnError::Io(format!("route: {e}")))?;

    let mut tun_buf = vec![0u8; MAX_PACKET];
    let mut udp_buf = vec![0u8; MAX_PACKET];
    let mut work = vec![0u8; MAX_PACKET];
    let mut timer = interval(Duration::from_millis(250));
    let mut connected = false;

    let result = loop {
        tokio::select! {
            _ = &mut stop => break Ok(()),

            r = dev.recv(&mut tun_buf) => {
                let n = r.map_err(|e| VpnError::Tun(e.to_string()))?;
                match tunn.encapsulate(&tun_buf[..n], &mut work) {
                    TunnResult::WriteToNetwork(b) => { let _ = socket.send(b).await; }
                    TunnResult::Err(e) => break Err(VpnError::Io(format!("encap: {e:?}"))),
                    _ => {}
                }
            }

            r = socket.recv(&mut udp_buf) => {
                let n = r.map_err(|e| VpnError::Io(e.to_string()))?;
                let mut datagram = &udp_buf[..n];
                loop {
                    match tunn.decapsulate(None, datagram, &mut work) {
                        TunnResult::WriteToNetwork(b) => {
                            let _ = socket.send(b).await;
                            datagram = &[];
                            continue;
                        }
                        TunnResult::WriteToTunnelV4(b, _) | TunnResult::WriteToTunnelV6(b, _) => {
                            let _ = dev.send(b).await;
                            if !connected {
                                connected = true;
                                emit(VpnEvent::Connected { assigned_ip: config.address.clone() });
                            }
                        }
                        TunnResult::Err(e) => break,
                        TunnResult::Done => break,
                    }
                    break;
                }
            }

            _ = timer.tick() => {
                match tunn.update_timers(&mut work) {
                    TunnResult::WriteToNetwork(b) => { let _ = socket.send(b).await; }
                    _ => {}
                }
            }
        }
    };

    let _ = route::remove_default_route("gnomevpn0", endpoint.ip());
    emit(VpnEvent::Disconnected);
    result
}

fn parse_cidr(value: &str) -> Result<std::net::Ipv4Addr, VpnError> {
    let ip = value.split('/').next().unwrap_or(value);
    ip.parse().map_err(|_| VpnError::Endpoint(format!("bad address {value}")))
}
```

> **Замечание для исполнителя:** `tun_rs` API (`DeviceBuilder`, `recv`/`send`) свериться с версией — метод-имена могли отличаться (`.build_async()` vs `.build()`); контракт (async recv/send байтов) сохраняется. `route` — модуль из следующего шага.

- [ ] **Step 2: Добавить платформенный модуль маршрутов `route` в `mod.rs`**

Добавь в `apps/tauri/src/vpn/mod.rs`:

```rust
pub mod route;
```

Create `apps/tauri/src/vpn/route.rs` (десктопные маршруты через системные команды):

```rust
use std::net::IpAddr;
use std::process::Command;

pub fn apply_default_route(_iface: &str, endpoint: IpAddr, _dns: &str) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        run(Command::new("route").args(["add", &endpoint.to_string(), "MASK", "255.255.255.255", &default_gateway_windows()?]))?;
        run(Command::new("route").args(["add", "0.0.0.0", "MASK", "0.0.0.0", "10.8.0.1", "IF", &iface_index_windows(_iface)?]))?;
        Ok(())
    }
    #[cfg(target_os = "linux")]
    {
        let gw = default_gateway_unix()?;
        run(Command::new("ip").args(["route", "add", &format!("{endpoint}/32"), "via", &gw]))?;
        run(Command::new("ip").args(["route", "add", "default", "dev", _iface]))?;
        Ok(())
    }
    #[cfg(target_os = "macos")]
    {
        let gw = default_gateway_unix()?;
        run(Command::new("route").args(["-n", "add", "-host", &endpoint.to_string(), &gw]))?;
        run(Command::new("route").args(["-n", "add", "-net", "0.0.0.0/1", "-interface", _iface]))?;
        run(Command::new("route").args(["-n", "add", "-net", "128.0.0.0/1", "-interface", _iface]))?;
        Ok(())
    }
    #[cfg(not(any(target_os = "windows", target_os = "linux", target_os = "macos")))]
    {
        let _ = endpoint;
        Err("unsupported platform".into())
    }
}

pub fn remove_default_route(_iface: &str, endpoint: IpAddr) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    { let _ = run(Command::new("route").args(["delete", &endpoint.to_string()])); Ok(()) }
    #[cfg(target_os = "linux")]
    { let _ = run(Command::new("ip").args(["route", "del", &format!("{endpoint}/32")])); Ok(()) }
    #[cfg(target_os = "macos")]
    { let _ = run(Command::new("route").args(["-n", "delete", "-host", &endpoint.to_string()])); Ok(()) }
    #[cfg(not(any(target_os = "windows", target_os = "linux", target_os = "macos")))]
    { let _ = endpoint; Ok(()) }
}

fn run(cmd: &mut Command) -> Result<(), String> {
    let out = cmd.output().map_err(|e| e.to_string())?;
    if out.status.success() { Ok(()) } else { Err(String::from_utf8_lossy(&out.stderr).to_string()) }
}

#[cfg(target_os = "windows")]
fn default_gateway_windows() -> Result<String, String> { Ok("0.0.0.0".into()) }
#[cfg(target_os = "windows")]
fn iface_index_windows(_iface: &str) -> Result<String, String> { Ok("0".into()) }

#[cfg(any(target_os = "linux", target_os = "macos"))]
fn default_gateway_unix() -> Result<String, String> {
    Err("resolve default gateway at implementation time".into())
}
```

> **Важное замечание для исполнителя:** маршрутизация — самая платформо-зависимая часть. Псевдо-функции `default_gateway_*` здесь возвращают заглушки/ошибки — их нужно реализовать под целевую ОС на этапе исполнения (получить текущий default gateway ДО поднятия туннеля, добавить host-route к endpoint через него, затем default через TUN). Рекомендуется на этапе исполнения свериться с тем, как это делает reference-клиент (например `wireguard-tools`/`wg-quick`). Это отмечено как область, требующая ручной доводки под каждую ОС (соответствует спеке §7B «привилегии — главная сложность»). Для первого прогона E2E достаточно одной целевой ОС (той, на которой разработчик тестирует).

- [ ] **Step 3: Компиляция**

Run: `cd apps/tauri && cargo build`
Expected: компилируется (могут быть warnings на unused в заглушках маршрутов — ок).

- [ ] **Step 4: Commit**

```bash
git add apps/tauri/src/vpn/engine.rs apps/tauri/src/vpn/route.rs apps/tauri/src/vpn/mod.rs
git commit -m "feat(tauri): implement boringtun tunnel loop + platform routing scaffold"
```

---

## Task 13: VPN-команды Tauri + регистрация + Channel

**Files:**

- Create: `apps/tauri/src/vpn/commands.rs`
- Modify: `apps/tauri/src/lib.rs` (регистрация команд + `.manage(VpnState)`)

**Interfaces:**

- Consumes: `VpnState`, `TunnelConfig`, `VpnEvent`, `run_tunnel`.
- Produces (вызываемо из JS через `invoke`):
  - `vpn_connect(config: TunnelConfig, on_event: Channel<VpnEvent>) -> Result<(), VpnError>`
  - `vpn_disconnect(state) -> Result<(), VpnError>`
  - `vpn_status(state) -> String` (`"disconnected"|"connecting"|"connected"`)

- [ ] **Step 1: `apps/tauri/src/vpn/commands.rs`**

```rust
use std::sync::Arc;

use tauri::ipc::Channel;
use tauri::State;
use tokio::sync::oneshot;

use super::engine::run_tunnel;
use super::state::{VpnState, VpnStatus};
use super::types::{TunnelConfig, VpnError, VpnEvent};

#[tauri::command]
pub async fn vpn_connect(
    config: TunnelConfig,
    on_event: Channel<VpnEvent>,
    state: State<'_, VpnState>,
) -> Result<(), VpnError> {
    {
        let mut rt = state.0.lock();
        if rt.status != VpnStatus::Disconnected {
            return Err(VpnError::AlreadyConnected);
        }
        rt.status = VpnStatus::Connecting;
    }

    let (stop_tx, stop_rx) = oneshot::channel();
    state.0.lock().stop = Some(stop_tx);

    let emit: Arc<dyn Fn(VpnEvent) + Send + Sync> = Arc::new(move |ev: VpnEvent| {
        let _ = on_event.send(ev);
    });

    let status_handle = state.inner();
    let emit_for_status = emit.clone();

    let result = run_tunnel(config, emit, stop_rx).await;

    {
        let mut rt = status_handle.0.lock();
        rt.status = VpnStatus::Disconnected;
        rt.stop = None;
    }

    if let Err(err) = &result {
        emit_for_status(VpnEvent::Error { message: err.to_string() });
    }
    result
}

#[tauri::command]
pub fn vpn_disconnect(state: State<'_, VpnState>) -> Result<(), VpnError> {
    let mut rt = state.0.lock();
    if let Some(stop) = rt.stop.take() {
        let _ = stop.send(());
    }
    rt.status = VpnStatus::Disconnected;
    Ok(())
}

#[tauri::command]
pub fn vpn_status(state: State<'_, VpnState>) -> String {
    match state.0.lock().status {
        VpnStatus::Disconnected => "disconnected",
        VpnStatus::Connecting => "connecting",
        VpnStatus::Connected => "connected",
    }
    .to_string()
}
```

> **Замечание:** статус `Connected` в state обновляется движком — для простоты Этапа 1 UI ориентируется на события Channel (`VpnEvent::Connected`), а `vpn_status` даёт грубый снапшот. Если нужно точное значение `Connected` в state — движок может писать его через shared-handle; на Этапе 1 достаточно Channel.

- [ ] **Step 2: Обновить `lib.rs` — подключить vpn-модуль, `.manage`, `generate_handler!`**

```rust
mod vpn;

use vpn::commands::{vpn_connect, vpn_disconnect, vpn_status};
use vpn::state::VpnState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default();

    #[cfg(not(any(target_os = "android", target_os = "ios")))]
    let builder = builder.plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
        use tauri::Manager;
        if let Some(window) = app.get_webview_window("main") {
            let _ = window.set_focus();
        }
    }));

    builder
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_process::init())
        .manage(VpnState::default())
        .invoke_handler(tauri::generate_handler![vpn_connect, vpn_disconnect, vpn_status])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

- [ ] **Step 3: Убедиться, что `mod.rs` включает все подмодули**

`apps/tauri/src/vpn/mod.rs` начинается с:

```rust
pub mod commands;
pub mod engine;
pub mod route;
pub mod state;
pub mod types;
```

- [ ] **Step 4: Компиляция**

Run: `cd apps/tauri && cargo build`
Expected: компилируется без ошибок. Команды зарегистрированы.

- [ ] **Step 5: Commit**

```bash
git add apps/tauri/src/vpn/commands.rs apps/tauri/src/lib.rs apps/tauri/src/vpn/mod.rs
git commit -m "feat(tauri): expose vpn_connect/disconnect/status commands with event channel"
```

---

## Task 14: Клиент bootstrap (Next.js + FSD skeleton + env + API)

**Files:**

- Create: `apps/client/package.json`, `apps/client/next.config.ts`, `apps/client/tsconfig.json`
- Create: `apps/client/shared/config/client-env.ts`
- Create: `apps/client/shared/api/http/api.ts`, `api-error.ts`, `index.ts`
- Create: `apps/client/shared/api/auth/auth-client.ts`
- Create: `apps/client/shared/api/query-client.ts`
- Create: `apps/client/shared/constants/query-keys.ts`, `index.ts`
- Create: `apps/client/shared/lib/tauri-platform.ts`, `apps/client/shared/lib/index.ts`

**Interfaces:**

- Consumes: `@gnomevpn/schemas`.
- Produces:
  - `api` (axios, Bearer из localStorage), `ApiError`, `toApiError`.
  - `authClient` (better-auth), `getAuthToken`/`saveAuthToken`/`clearToken`.
  - `queryClient` (singleton).
  - `QUERY_KEYS` (`nodes`, `subscriptionStatus`).
  - `isTauriDesktop()`, `isTauri`.
  - API-функции доменов (в Task 15/16).

- [ ] **Step 1: `apps/client/package.json`**

```json
{
  "name": "@gnomevpn/client",
  "type": "module",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build",
    "start": "next start -p 3000",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "next": "^16.2.10",
    "react": "^19.2.7",
    "react-dom": "^19.2.7",
    "@tanstack/react-query": "^5.101.2",
    "better-auth": "^1.6.23",
    "axios": "^1.18.1",
    "react-hook-form": "^7.81.0",
    "@hookform/resolvers": "^5.4.0",
    "zod": "^4.4.3",
    "@gnomevpn/schemas": "workspace:*",
    "clsx": "^2.1.1",
    "lucide-react": "^0.500.0",
    "sonner": "^2.0.0",
    "@tauri-apps/api": "^2.11.1",
    "@tauri-apps/plugin-os": "^2",
    "@tauri-apps/plugin-opener": "^2"
  },
  "devDependencies": {
    "sass": "^1.101.0",
    "typescript": "~6.0.3",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "@types/node": "^22"
  }
}
```

- [ ] **Step 2: `apps/client/next.config.ts`**

```ts
import type { NextConfig } from 'next';
import path from 'node:path';

const clientRoot = path.resolve(import.meta.dirname);

const nextConfig: NextConfig = {
  output: 'export',
  reactStrictMode: false,
  images: { unoptimized: true },
  sassOptions: { loadPaths: [clientRoot] },
  turbopack: { resolveAlias: { '@': clientRoot } },
};

export default nextConfig;
```

- [ ] **Step 3: `apps/client/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "jsx": "preserve",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] },
    "noEmit": true
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", "out"]
}
```

- [ ] **Step 4: `apps/client/shared/config/client-env.ts`**

```ts
import { z } from 'zod';

const schema = z.object({
  NEXT_PUBLIC_API_URL: z.url().default('http://localhost:4000'),
});

export const env = schema.parse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
});
```

- [ ] **Step 5: `apps/client/shared/api/auth/auth-client.ts`**

```ts
import { createAuthClient } from 'better-auth/react';
import { env } from '@/shared/config/client-env';

const STORAGE_KEY = 'gnomevpn.auth-token';

export const getAuthToken = () => {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(STORAGE_KEY) ?? '';
};

export const saveAuthToken = (token: string | null) => {
  if (typeof window === 'undefined' || !token) return;
  window.localStorage.setItem(STORAGE_KEY, token);
};

export const clearToken = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
};

export const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_API_URL,
  basePath: '/auth',
  fetchOptions: {
    auth: { type: 'Bearer', token: getAuthToken },
    onSuccess: (ctx) => {
      const token = ctx.response.headers.get('set-auth-token');
      saveAuthToken(token);
    },
  },
});
```

- [ ] **Step 6: `apps/client/shared/api/http/api-error.ts`**

```ts
import { apiErrorSchema } from '@gnomevpn/schemas';
import type { ApiErrorCode } from '@gnomevpn/schemas';

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  constructor(code: ApiErrorCode, message: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

export const toApiError = (data: unknown) => {
  const parsed = apiErrorSchema.safeParse(data);
  if (!parsed.success) return null;
  return new ApiError(parsed.data.code, parsed.data.error);
};

export const apiErrorCode = (error: unknown): ApiErrorCode =>
  error instanceof ApiError ? error.code : 'INTERNAL_ERROR';
```

- [ ] **Step 7: `apps/client/shared/api/http/api.ts` + `index.ts`**

`api.ts`:

```ts
import axios from 'axios';
import { env } from '@/shared/config/client-env';
import { getAuthToken } from '../auth/auth-client';
import { toApiError } from './api-error';

export const api = axios.create({ baseURL: env.NEXT_PUBLIC_API_URL });

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(undefined, (error) => {
  if (axios.isAxiosError(error)) {
    const apiError = toApiError(error.response?.data);
    if (apiError) return Promise.reject(apiError);
  }
  return Promise.reject(error);
});
```

`shared/api/http/index.ts`:

```ts
export { api } from './api';
export { ApiError, apiErrorCode, toApiError } from './api-error';
```

- [ ] **Step 8: `apps/client/shared/api/query-client.ts`**

```ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 60_000, refetchOnWindowFocus: false },
  },
});
```

- [ ] **Step 9: `apps/client/shared/constants/query-keys.ts` + `index.ts`**

`query-keys.ts`:

```ts
export const QUERY_KEYS = {
  nodes: () => ['nodes'] as const,
  subscriptionStatus: () => ['subscription-status'] as const,
};
```

`shared/constants/index.ts`:

```ts
export { QUERY_KEYS } from './query-keys';
```

- [ ] **Step 10: `apps/client/shared/lib/tauri-platform.ts` + `index.ts`**

`tauri-platform.ts`:

```ts
import { isTauri } from '@tauri-apps/api/core';
import { type as osType } from '@tauri-apps/plugin-os';

export const isTauriMobile = (): boolean => {
  if (typeof window === 'undefined' || !isTauri()) return false;
  const type = osType();
  return type === 'android' || type === 'ios';
};

export const isTauriDesktop = (): boolean => isTauri() && !isTauriMobile();
```

`shared/lib/index.ts`:

```ts
export { isTauriDesktop, isTauriMobile } from './tauri-platform';
```

- [ ] **Step 11: `apps/client/shared/api/index.ts`** (плоский баррел; функции доменов добавятся в Task 15/16)

```ts
export * from './http';
export { queryClient } from './query-client';
export { authClient, clearToken, getAuthToken, saveAuthToken } from './auth/auth-client';
```

- [ ] **Step 12: Установить и проверить typecheck (skeleton без страниц ещё не соберётся — только typecheck модулей)**

Run: `cd c:/Projects/gnomevpn && bun install`
Expected: ставится.

> Полный `next build` пока невозможен (нет `app/` роутов) — они появятся в Task 15. Здесь проверяем только, что модули shared/ типизируются:
Run: `cd apps/client && bun x tsc --noEmit`
Expected: без ошибок (или только про отсутствие `app/` — это ок до Task 15).

- [ ] **Step 13: Commit**

```bash
git add apps/client bun.lock
git commit -m "feat(client): bootstrap Next.js + FSD shared (api, auth, query, tauri-platform)"
```

---

## Task 15: VPN-мост к Rust + entities (node, tunnel) + API-функции

**Files:**

- Create: `apps/client/shared/lib/vpn-bridge/vpn-bridge.ts`, `index.ts`
- Create: `apps/client/shared/api/vpn/vpn.ts` (nodes + tunnel HTTP)
- Create: `apps/client/entities/vpn/node/model/hooks/use-nodes.ts`, `index.ts`
- Create: `apps/client/entities/billing/subscription/model/hooks/use-subscription-status.ts`, `index.ts`

**Interfaces:**

- Consumes: `api`, `@gnomevpn/schemas` (`Node`, `TunnelConfig`, `ConnectRequest`, `SubscriptionStatus`), Tauri `invoke`/`Channel`.
- Produces:
  - `listNodes(): Promise<Node[]>`, `connectTunnel(nodeId): Promise<TunnelConfig>`, `disconnectTunnel(): Promise<void>`, `getSubscriptionStatus(): Promise<SubscriptionStatus>`.
  - `vpnConnect(config, onEvent): Promise<void>`, `vpnDisconnect(): Promise<void>`, `vpnStatus(): Promise<string>` — обёртки над Rust-командами (гейт `isTauri()`).
  - `VpnEvent` TS-тип (зеркалит Rust).
  - `useNodes()`, `useSubscriptionStatus()`.

- [ ] **Step 1: `apps/client/shared/lib/vpn-bridge/vpn-bridge.ts`**

```ts
import { Channel, invoke, isTauri } from '@tauri-apps/api/core';
import type { TunnelConfig } from '@gnomevpn/schemas';

export type VpnEvent =
  | { type: 'connecting' }
  | { type: 'handshake' }
  | { type: 'connected'; assignedIp: string }
  | { type: 'bytesUpdate'; rx: number; tx: number }
  | { type: 'disconnected' }
  | { type: 'error'; message: string };

export const vpnConnect = async (
  config: TunnelConfig,
  onEvent: (event: VpnEvent) => void,
): Promise<void> => {
  if (!isTauri()) {
    throw new Error('VPN is only available in the desktop app');
  }
  const channel = new Channel<VpnEvent>();
  channel.onmessage = onEvent;
  await invoke('vpn_connect', { config, onEvent: channel });
};

export const vpnDisconnect = async (): Promise<void> => {
  if (!isTauri()) return;
  await invoke('vpn_disconnect');
};

export const vpnStatus = async (): Promise<string> => {
  if (!isTauri()) return 'disconnected';
  return invoke<string>('vpn_status');
};
```

`shared/lib/vpn-bridge/index.ts`:

```ts
export { vpnConnect, vpnDisconnect, vpnStatus } from './vpn-bridge';
export type { VpnEvent } from './vpn-bridge';
```

Добавить в `shared/lib/index.ts`:

```ts
export { isTauriDesktop, isTauriMobile } from './tauri-platform';
export { vpnConnect, vpnDisconnect, vpnStatus } from './vpn-bridge';
export type { VpnEvent } from './vpn-bridge';
```

- [ ] **Step 2: `apps/client/shared/api/vpn/vpn.ts`**

```ts
import type { Node, SubscriptionStatus, TunnelConfig } from '@gnomevpn/schemas';
import { api } from '../http';

export const listNodes = async (): Promise<Node[]> => {
  const { data } = await api.get('/nodes');
  return data;
};

export const connectTunnel = async (nodeId: string): Promise<TunnelConfig> => {
  const { data } = await api.post('/tunnel/connect', { nodeId });
  return data;
};

export const disconnectTunnel = async (): Promise<void> => {
  await api.post('/tunnel/disconnect');
};

export const getSubscriptionStatus = async (): Promise<SubscriptionStatus> => {
  const { data } = await api.get('/subscription/status');
  return data;
};
```

Добавить реэкспорт в `shared/api/index.ts`:

```ts
export { connectTunnel, disconnectTunnel, getSubscriptionStatus, listNodes } from './vpn/vpn';
```

- [ ] **Step 3: `apps/client/entities/vpn/node/model/hooks/use-nodes.ts` + `index.ts`**

`use-nodes.ts`:

```ts
import { useQuery } from '@tanstack/react-query';
import { listNodes } from '@/shared/api';
import { QUERY_KEYS } from '@/shared/constants';

export const useNodes = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: QUERY_KEYS.nodes(),
    queryFn: listNodes,
  });
  return { nodes: data ?? [], isLoading, isError };
};
```

`entities/vpn/node/index.ts`:

```ts
export { useNodes } from './model/hooks/use-nodes';
```

- [ ] **Step 4: `apps/client/entities/billing/subscription/model/hooks/use-subscription-status.ts` + `index.ts`**

`use-subscription-status.ts`:

```ts
import { useQuery } from '@tanstack/react-query';
import { getSubscriptionStatus } from '@/shared/api';
import { QUERY_KEYS } from '@/shared/constants';

export const useSubscriptionStatus = () => {
  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.subscriptionStatus(),
    queryFn: getSubscriptionStatus,
  });
  return { subscription: data ?? null, isLoading };
};
```

`entities/billing/subscription/index.ts`:

```ts
export { useSubscriptionStatus } from './model/hooks/use-subscription-status';
```

- [ ] **Step 5: Typecheck**

Run: `cd apps/client && bun x tsc --noEmit`
Expected: без ошибок (кроме, возможно, отсутствия `app/` — ок до Task 16).

- [ ] **Step 6: Commit**

```bash
git add apps/client/shared apps/client/entities
git commit -m "feat(client): add vpn bridge, api functions, node/subscription query hooks"
```

---

## Task 16: VPN connect-feature + экран /app + роуты

**Files:**

- Create: `apps/client/features/vpn/connect/model/use-vpn-connection.ts`
- Create: `apps/client/features/vpn/connect/ui/ConnectButton.tsx`, `ConnectButton.module.scss`
- Create: `apps/client/features/vpn/connect/index.ts`
- Create: `apps/client/views/app-view/ui/AppView.tsx`, `AppView.module.scss`, `index.ts`
- Create: `apps/client/app/layout.tsx`, `apps/client/app/globals.scss`
- Create: `apps/client/app/providers/AppProviders.tsx`
- Create: `apps/client/app/app/page.tsx` (route `/app`)
- Create: `apps/client/app/page.tsx` (landing-заглушка), `apps/client/app/account/page.tsx` (account-заглушка)

**Interfaces:**

- Consumes: `useNodes`, `useSubscriptionStatus`, `connectTunnel`/`disconnectTunnel` (api), `vpnConnect`/`vpnDisconnect` (bridge).
- Produces:
  - `useVpnConnection()` → `{ status, activeNodeId, connect(nodeId), disconnect() }` — оркестрирует HTTP-connect → Rust-туннель, слушает Channel.
  - Экран `/app`: список стран + ConnectButton + статус.

- [ ] **Step 1: `features/vpn/connect/model/use-vpn-connection.ts`**

```ts
'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { connectTunnel, disconnectTunnel } from '@/shared/api';
import { apiErrorCode } from '@/shared/api';
import { vpnConnect, vpnDisconnect, type VpnEvent } from '@/shared/lib';

type Status = 'disconnected' | 'connecting' | 'connected';

export const useVpnConnection = () => {
  const [status, setStatus] = useState<Status>('disconnected');
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);

  const onEvent = (event: VpnEvent) => {
    if (event.type === 'connected') setStatus('connected');
    if (event.type === 'disconnected') {
      setStatus('disconnected');
      setActiveNodeId(null);
    }
    if (event.type === 'error') {
      setStatus('disconnected');
      setActiveNodeId(null);
      toast.error(event.message);
    }
  };

  const connect = async (nodeId: string) => {
    setStatus('connecting');
    setActiveNodeId(nodeId);
    try {
      const config = await connectTunnel(nodeId);
      await vpnConnect(config, onEvent);
    } catch (error) {
      setStatus('disconnected');
      setActiveNodeId(null);
      const code = apiErrorCode(error);
      toast.error(
        code === 'PAYMENT_REQUIRED'
          ? 'Требуется активная подписка'
          : 'Не удалось подключиться',
      );
    }
  };

  const disconnect = async () => {
    await disconnectTunnel().catch(() => undefined);
    await vpnDisconnect();
    setStatus('disconnected');
    setActiveNodeId(null);
  };

  return { status, activeNodeId, connect, disconnect };
};
```

- [ ] **Step 2: `features/vpn/connect/ui/ConnectButton.tsx` + `.module.scss` + `index.ts`**

`ConnectButton.tsx`:

```tsx
'use client';

import { clsx } from 'clsx';
import { Power } from 'lucide-react';
import s from './ConnectButton.module.scss';

type Status = 'disconnected' | 'connecting' | 'connected';

type ConnectButtonProps = {
  status: Status;
  disabled?: boolean;
  onToggle: () => void;
};

const LABELS: Record<Status, string> = {
  disconnected: 'Подключиться',
  connecting: 'Подключаем…',
  connected: 'Отключиться',
};

export const ConnectButton = ({ status, disabled, onToggle }: ConnectButtonProps) => (
  <button
    className={clsx(s.root, s[status])}
    disabled={disabled || status === 'connecting'}
    type="button"
    onClick={onToggle}
  >
    <Power className={s.icon} />
    <span>{LABELS[status]}</span>
  </button>
);
```

`ConnectButton.module.scss`:

```scss
.root {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  justify-content: center;
  width: 160px;
  height: 160px;
  border: none;
  border-radius: 50%;
  color: #fff;
  font-size: 15px;
  cursor: pointer;
  transition: background-color 200ms ease, transform 120ms ease;

  &:active:not(:disabled) { transform: scale(0.97); }
  &:disabled { cursor: default; opacity: 0.85; }
}

.icon { width: 40px; height: 40px; }

.disconnected { background: #3f3f46; }
.connecting { background: #ca8a04; }
.connected { background: #16a34a; }
```

`features/vpn/connect/index.ts`:

```ts
export { ConnectButton } from './ui/ConnectButton';
export { useVpnConnection } from './model/use-vpn-connection';
```

- [ ] **Step 3: `views/app-view/ui/AppView.tsx` + `.module.scss` + `index.ts`**

`AppView.tsx`:

```tsx
'use client';

import { clsx } from 'clsx';
import { useNodes } from '@/entities/vpn/node';
import { ConnectButton, useVpnConnection } from '@/features/vpn/connect';
import s from './AppView.module.scss';

export const AppView = () => {
  const { nodes, isLoading } = useNodes();
  const { status, activeNodeId, connect, disconnect } = useVpnConnection();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const effectiveNodeId = activeNodeId ?? selectedNodeId ?? nodes[0]?.id ?? null;

  const onToggle = () => {
    if (status === 'connected') {
      void disconnect();
      return;
    }
    if (effectiveNodeId) void connect(effectiveNodeId);
  };

  return (
    <main className={s.root}>
      <h1 className={s.title}>GnomeVPN</h1>

      <ConnectButton status={status} disabled={!effectiveNodeId} onToggle={onToggle} />

      <section className={s.nodes}>
        {isLoading && <p className={s.hint}>Загрузка стран…</p>}
        {!isLoading && nodes.length === 0 && <p className={s.hint}>Нет доступных стран</p>}
        {nodes.map((node) => (
          <button
            key={node.id}
            className={clsx(s.node, effectiveNodeId === node.id && s.nodeActive)}
            disabled={status !== 'disconnected'}
            type="button"
            onClick={() => setSelectedNodeId(node.id)}
          >
            <span className={s.flag}>{node.flagEmoji}</span>
            <span>{node.country}</span>
          </button>
        ))}
      </section>
    </main>
  );
};
```

> **Замечание для исполнителя:** добавь `import { useState } from 'react';` первой строкой импортов (опущено для краткости — обязательно допиши).

`AppView.module.scss`:

```scss
.root {
  display: flex;
  flex-direction: column;
  gap: 32px;
  align-items: center;
  min-height: 100vh;
  padding: 32px 20px;
  background: #0a0a0b;
  color: #fafafa;
}

.title { margin: 0; font-size: 22px; font-weight: 700; }
.nodes { display: flex; flex-direction: column; gap: 8px; width: 100%; max-width: 320px; }
.hint { color: #a1a1aa; text-align: center; }

.node {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 12px 16px;
  border: 1px solid #27272a;
  border-radius: 12px;
  background: #18181b;
  color: inherit;
  font-size: 15px;
  cursor: pointer;

  &:disabled { cursor: default; opacity: 0.6; }
}

.nodeActive { border-color: #16a34a; }
.flag { font-size: 22px; }
```

`views/app-view/index.ts`:

```ts
export { AppView } from './ui/AppView';
```

- [ ] **Step 4: `app/globals.scss`**

```scss
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body { font-family: system-ui, -apple-system, sans-serif; }
```

- [ ] **Step 5: `app/providers/AppProviders.tsx`**

```tsx
'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { queryClient } from '@/shared/api';
import type { ReactNode } from 'react';

export const AppProviders = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    {children}
    <Toaster position="top-center" theme="dark" />
  </QueryClientProvider>
);
```

- [ ] **Step 6: `app/layout.tsx`**

```tsx
import { AppProviders } from './providers/AppProviders';
import type { ReactNode } from 'react';
import './globals.scss';

export const metadata = { title: 'GnomeVPN', description: 'GnomeVPN VPN' };

const RootLayout = ({ children }: { children: ReactNode }) => (
  <html lang="ru" className="dark">
    <body>
      <AppProviders>{children}</AppProviders>
    </body>
  </html>
);

export default RootLayout;
```

- [ ] **Step 7: `app/app/page.tsx` (route `/app`)**

```tsx
import { AppView } from '@/views/app-view';

const Page = () => <AppView />;

export default Page;
```

- [ ] **Step 8: `app/page.tsx` (landing-заглушка) + `app/account/page.tsx` (account-заглушка)**

`app/page.tsx`:

```tsx
const Page = () => (
  <main style={{ padding: 40 }}>
    <h1>GnomeVPN VPN</h1>
    <p>Лендинг появится на Этапе 3. Скачайте десктоп-приложение, чтобы подключиться.</p>
    <a href="/account">Личный кабинет</a>
  </main>
);

export default Page;
```

`app/account/page.tsx`:

```tsx
const Page = () => (
  <main style={{ padding: 40 }}>
    <h1>Личный кабинет</h1>
    <p>Вход и оплата появятся на Этапе 2.</p>
  </main>
);

export default Page;
```

- [ ] **Step 9: Собрать клиент (статический экспорт)**

Run: `cd apps/client && bun run build`
Expected: `next build` завершается, создаётся `apps/client/out` со статикой (включая `/app/index.html`).

- [ ] **Step 10: Typecheck**

Run: `cd apps/client && bun x tsc --noEmit`
Expected: без ошибок.

- [ ] **Step 11: Commit**

```bash
git add apps/client/features apps/client/views apps/client/app
git commit -m "feat(client): add VPN connect feature and /app screen with country selector"
```

---

## Task 17: Инфраструктура — Postgres (dev) + wg-easy узел (одна страна)

**Files:**

- Create: `c:/Projects/gnomevpn/docker-compose.dev.yml`
- Create: `c:/Projects/gnomevpn/infra/wg-easy/docker-compose.yml`
- Create: `c:/Projects/gnomevpn/infra/wg-easy/README.md`

**Interfaces:**

- Produces: локальный Postgres для backend; шаблон странового узла wg-easy (разворачивается на VPS).

> **Замечание:** wg-easy-узел в проде живёт на отдельном VPS в выбранной стране. Для локальной E2E-проверки его можно поднять и локально (тогда «страна» = твой текущий IP — смены IP не будет, но связность туннеля проверяется). Настоящую смену IP проверяют против wg-easy на реальном удалённом VPS.

- [ ] **Step 1: `docker-compose.dev.yml` (Postgres для backend)**

```yaml
services:
  postgres:
    image: postgres:17
    restart: unless-stopped
    environment:
      POSTGRES_USER: gnomevpn
      POSTGRES_PASSWORD: gnomevpn
      POSTGRES_DB: gnomevpn
    ports:
      - "5432:5432"
    volumes:
      - gnomevpn_pg:/var/lib/postgresql/data

volumes:
  gnomevpn_pg:
```

- [ ] **Step 2: `infra/wg-easy/docker-compose.yml` (страновой узел)**

```yaml
services:
  wg-easy:
    image: ghcr.io/wg-easy/wg-easy:14
    restart: unless-stopped
    environment:
      # хост:порт, который попадёт клиенту как endpoint (публичный IP/домен этого VPS)
      WG_HOST: ${WG_HOST}
      # пароль/ключ для REST-панели (backend читает через wgEasyApiKeyRef)
      INIT_PASSWORD: ${WG_EASY_PASSWORD}
      WG_DEFAULT_DNS: 1.1.1.1
    cap_add:
      - NET_ADMIN
      - SYS_MODULE
    sysctls:
      - net.ipv4.ip_forward=1
      - net.ipv4.conf.all.src_valid_mark=1
    ports:
      - "51820:51820/udp"   # WireGuard-трафик (наружу)
      - "127.0.0.1:51821:51821/tcp"  # REST/панель — ТОЛЬКО локально/приватно, не в интернет
    volumes:
      - wg_easy:/etc/wireguard

volumes:
  wg_easy:
```

> **Замечание для исполнителя:** образ/переменные wg-easy отличаются по мажорным версиям (v14 vs v15 — у v15 другой REST). Свериться с актуальной документацией wg-easy при развёртывании и при необходимости подправить пути в `WgEasyClient` (Task 5). Порт REST (`51821`) наружу НЕ открывать — только приватная сеть/SSH-туннель до backend (спека §5).

- [ ] **Step 3: `infra/wg-easy/README.md`**

```markdown
# GnomeVPN — wg-easy country node

One VPS per country. Deploy steps:

1. Point a DNS record (e.g. `de.gnomevpn.example`) at the VPS public IP.
2. Copy this folder to the VPS.
3. Create `.env` next to compose:
   ```

   WG_HOST=de.gnomevpn.example
   WG_EASY_PASSWORD=<strong-secret>

   ```
4. `docker compose up -d`
5. Ensure the firewall exposes ONLY `51820/udp` publicly. The REST port `51821`
   must be reachable only from the backend (private network or SSH tunnel).
6. Register the node in the backend DB (`Node` table):
   - `country`, `countryCode`, `flagEmoji`
   - `publicEndpoint` = `de.gnomevpn.example:51820`
   - `wgEasyUrl` = private URL of the REST API (e.g. `http://10.0.0.5:51821`)
   - `wgEasyApiKeyRef` = name of the backend env var holding the REST secret
     (e.g. `WG_EASY_KEY_DE`), and set that env var on the backend to `WG_EASY_PASSWORD`.
```

- [ ] **Step 4: Поднять Postgres и убедиться, что backend видит БД**

Run: `cd c:/Projects/gnomevpn && docker compose -f docker-compose.dev.yml up -d`
Then: `cd apps/server && bun run db:push`
Expected: схема применяется без ошибок.

- [ ] **Step 5: Commit**

```bash
git add docker-compose.dev.yml infra/wg-easy
git commit -m "chore(infra): add dev postgres and wg-easy node template"
```

---

## Task 18: Сид узла + сквозной E2E (критерий готовности)

**Files:**

- Create: `apps/server/scripts/seed-node.ts`
- Modify: `apps/server/package.json` (скрипт `seed:node`)

**Interfaces:**

- Consumes: `basePrisma`.
- Produces: одна запись `Node` в БД, указывающая на реальный wg-easy VPS; проверенный сквозной сценарий Connect→смена IP→Disconnect.

- [ ] **Step 1: `apps/server/scripts/seed-node.ts`**

```ts
import { basePrisma } from '../src/core';

const main = async () => {
  const country = process.env.SEED_COUNTRY ?? 'Germany';
  const countryCode = process.env.SEED_COUNTRY_CODE ?? 'DE';
  const flagEmoji = process.env.SEED_FLAG ?? '🇩🇪';
  const publicEndpoint = process.env.SEED_ENDPOINT;
  const wgEasyUrl = process.env.SEED_WG_EASY_URL;
  const wgEasyApiKeyRef = process.env.SEED_WG_EASY_KEY_REF ?? 'WG_EASY_KEY_DE';

  if (!publicEndpoint || !wgEasyUrl) {
    throw new Error('SEED_ENDPOINT and SEED_WG_EASY_URL are required');
  }

  const node = await basePrisma.node.create({
    data: { country, countryCode, flagEmoji, publicEndpoint, wgEasyUrl, wgEasyApiKeyRef, enabled: true },
  });

  process.stdout.write(`Seeded node ${node.id} (${country})\n`);
  await basePrisma.$disconnect();
};

void main();
```

- [ ] **Step 2: Добавить скрипт в `apps/server/package.json`**

Добавь в `"scripts"`:

```json
"seed:node": "bun --env-file .env scripts/seed-node.ts"
```

- [ ] **Step 3: Развернуть реальный wg-easy VPS и засидить узел**

- Разверни `infra/wg-easy` на VPS в выбранной стране (по README Task 17).
- В `apps/server/.env` добавь секрет узла: `WG_EASY_KEY_DE=<пароль из wg-easy>`.
- Запусти сид:

Run: `cd apps/server && SEED_ENDPOINT=de.gnomevpn.example:51820 SEED_WG_EASY_URL=http://<private-ip>:51821 bun run seed:node`
Expected: `Seeded node <uuid> (Germany)`.

- [ ] **Step 4: Проверить, что `/nodes` отдаёт страну**

Run: `curl http://localhost:4000/nodes`
Expected: JSON-массив с одной страной (`Germany`, флаг, без внутренних полей).

- [ ] **Step 5: Запустить desktop-приложение**

Run: `cd c:/Projects/gnomevpn && bun run tauri:dev`
Expected: открывается окно GnomeVPN с экраном `/app`, показана страна Germany и кнопка «Подключиться».

> **Права:** для поднятия TUN и правки маршрутов приложению нужны админ-права (спека §7B). На Windows — запустить из терминала с админ-правами; на Linux — `sudo` или `setcap cap_net_admin+ep` на бинарь; на macOS — с правами. Это Этап-1-компромисс (хелпер — Этап 4).

- [ ] **Step 6: E2E — зарегистрироваться, подключиться, проверить смену IP**

1. В приложении (или через веб `/account` на Этапе 2 — сейчас регистрация через API) создай пользователя: `curl -X POST http://localhost:4000/auth/sign-up/email -H "Content-Type: application/json" -d '{"email":"e2e@gnomevpn.test","password":"password123","name":"E2E"}'` и сохрани `set-auth-token`.
2. Проверь исходный IP: `curl https://api.ipify.org` — запиши.
3. В приложении выбери Germany → нажми «Подключиться». Дождись зелёного «Отключиться».
4. Проверь IP снова: `curl https://api.ipify.org`.

Expected: **после Connect IP отличается от исходного и соответствует стране VPS.** Это и есть критерий готовности Этапа 1.

- [ ] **Step 7: E2E — отключение возвращает исходный IP**

1. Нажми «Отключиться».
2. Проверь: `curl https://api.ipify.org`.

Expected: IP снова равен исходному (из шага 6.2). Кнопка вернулась в «Подключиться».

- [ ] **Step 8: Проверить очистку пира**

Run: `cd apps/server && bun run db:studio` → открой таблицу `active_peer`.
Expected: после Disconnect строки `ActivePeer` для пользователя нет; в wg-easy панели пир тоже исчез.

- [ ] **Step 9: Проверить single-connection инвариант**

Подключись к стране, затем (не отключаясь) вызови connect повторно (через приложение переключением страны, если стран несколько, или повторным connect):
Expected: старый пир снят, `ActivePeer` один; на wg-easy не копятся дубли.

- [ ] **Step 10: Финальный прогон всех юнит-тестов и typecheck**

Run: `cd c:/Projects/gnomevpn && bun --filter @gnomevpn/schemas test && bun --filter @gnomevpn/server test && cargo test --manifest-path apps/tauri/Cargo.toml && bun typecheck`
Expected: все тесты зелёные, typecheck без ошибок.

- [ ] **Step 11: Commit**

```bash
git add apps/server/scripts apps/server/package.json
git commit -m "feat(server): add node seed script; verify end-to-end tunnel"
```

---

## Definition of Done (Этап 1)

- [ ] `bun run tauri:dev` открывает desktop-приложение со списком стран и кнопкой Connect.
- [ ] Регистрация/логин через better-auth работает (Bearer-токен в localStorage).
- [ ] `GET /nodes` возвращает страны без внутренних полей.
- [ ] Нажатие Connect: backend создаёт пира через wg-easy, отдаёт `TunnelConfig`, Rust поднимает boringtun-туннель.
- [ ] **`curl https://api.ipify.org` показывает IP страны после Connect и исходный IP после Disconnect.** (главный критерий)
- [ ] Disconnect снимает пира (`ActivePeer` удалён, пир исчез в wg-easy).
- [ ] Повторный Connect снимает предыдущий пир (single-connection инвариант).
- [ ] Subscription-guard на месте (всегда разрешает — заглушка Этапа 1).
- [ ] Все юнит-тесты (`schemas`, `server`, Rust `vpn`) зелёные; `bun typecheck` чист.

## Что НЕ входит в Этап 1 (следующие этапы)

- Оплата ЮKassa + реальный гейт подписки (Этап 2).
- Веб-кабинет `/account` с логином/оплатой, лендинг `/` (Этапы 2–3).
- Остальные страны (Этап 3).
- Привилегированный хелпер + kill-switch + автозапуск (Этап 4).
- Mobile — Android/iOS VPN (Этап 5).
- Обфускация AmneziaWG под РФ-DPI (Этап 6).
- Сборка мусора висячих пиров по `latestHandshake` — метод `getClientHandshake` в `WgEasyClient` уже есть; cron-задача добавляется в Этап 2 вместе с планировщиком.
