# GnomeVPN Этап 2: оплата, кабинет, гейт подписки — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Закрыть туннель платным гейтом: регистрация/вход через UI, оплата 100₽/мес через ЮKassa, автопродление, кабинет `/account`, GC висячих пиров.

**Architecture:** Backend — новый модуль `billing` (контроллер + сервис + `lib/yookassa` клиент) и `scheduler` (два cron-джоба); в `subscription` меняется единственный метод `hasActiveAccess`. Frontend — FSD по образцу Chatovo: `shared/ui` примитивы, слайсы `features/auth/*` и `features/billing/checkout`, `views/auth` и `views/account`, редиректы в `AuthProvider`. Схемы только в `@gnomevpn/schemas`.

**Tech Stack:** NestJS 11 (Bun runtime), Prisma 7, better-auth, `@nestjs/schedule`, Next.js 16, react-hook-form + zodResolver, TanStack Query, sonner, ts-pattern, SCSS-модули, vitest.

**Спека:** `docs/superpowers/specs/2026-07-19-gnomevpn-stage2-billing-design.md`

---

## Глобальные правила

Из `docs/style.md` и плана Этапа 1 — действуют во всех задачах:

- **Комментарии в коде запрещены** (`//`, JSDoc), кроме `biome-ignore` с обоснованием
- `type`, не `interface`. `any` запрещён — `unknown`
- Props в `<Name>.types.ts`; порядок полей: данные → id/className → обработчики `on*`
- Arrow-функции с block body + `return`; исключение — компоненты, возвращающие JSX
- `if`/`else` всегда с `{}`
- 3+ ветки рендера → `ts-pattern` `match().exhaustive()`; одна ветка → `cond && <X />`
- Barrel `index.ts` у каждого слайса, явные именованные реэкспорты, `export *` запрещён
- Файл компонента ≤ 100 строк JSX; больше — выносить в `ui/components/`
- Схемы только в `packages/schemas`, дублирование запрещено
- `useState` для полей формы запрещён — только react-hook-form
- Запуск тестов: `bunx vitest run <путь>` из корня репозитория

## Структура файлов

**Создаются:**

| Файл | Ответственность |
|---|---|
| `packages/schemas/src/auth/inputs.ts` | `signInSchema`, `signUpSchema` |
| `packages/schemas/src/auth/types.ts` | `SignInValues`, `SignUpValues` |
| `packages/schemas/src/billing/outputs.ts` | `checkoutResultSchema` |
| `packages/schemas/src/billing/inputs.ts` | `webhookEventSchema` |
| `apps/server/src/lib/yookassa/yookassa.ts` | HTTP-клиент ЮKassa, без Nest |
| `apps/server/src/modules/billing/billing.service.ts` | Логика платежей и вебхука |
| `apps/server/src/modules/billing/billing.controller.ts` | `POST /billing/checkout`, `/webhook`, `/cancel` |
| `apps/server/src/modules/scheduler/recurring-charge.job.ts` | Автосписания |
| `apps/server/src/modules/scheduler/peer-gc.job.ts` | Снятие висячих пиров |
| `apps/client/shared/ui/atoms/*` | Input, PasswordInput, Button, Label, Text, Spinner |
| `apps/client/shared/ui/molecules/*` | FormField, SubmitButton |
| `apps/client/features/auth/sign-in`, `sign-up` | Формы + мутации |
| `apps/client/features/billing/checkout` | Кнопка оплаты |
| `apps/client/entities/auth/user` | `useCurrentUser` |
| `apps/client/entities/billing/subscription` | `useSubscriptionStatus` |
| `apps/client/views/auth`, `views/account` | Страницы |
| `apps/client/app/providers/AuthProvider.tsx` | Редиректы по сессии |

**Модифицируются:**

| Файл | Что |
|---|---|
| `apps/server/prisma/schema.prisma` | `Payment`, поля в `Subscription` |
| `apps/server/src/modules/auth/auth.ts` | Хук регистрации: `expired` вместо `active` |
| `apps/server/src/modules/subscription/subscription.service.ts` | Реальный `hasActiveAccess` |
| `apps/server/src/config/env.schema.ts` | Ключи ЮKassa |
| `apps/server/src/app.module.ts` | Регистрация `BillingModule`, `SchedulerModule` |
| `packages/schemas/src/errors/codes.ts` | `PAYMENT_FAILED`, `WEBHOOK_INVALID` |
| `apps/client/app/account/page.tsx` | Заглушка → `AccountPage` |
| `apps/client/app/providers/AppProviders.tsx` | Добавить `AuthProvider` |

---

# Блок 1. Схемы и модель данных

### Задача 1: Коды ошибок билинга

**Files:**
- Modify: `packages/schemas/src/errors/codes.ts`

- [ ] **Шаг 1: Добавить коды**

```ts
import { z } from 'zod';

export const apiErrorCodeSchema = z.enum([
  'VALIDATION_FAILED',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'PAYMENT_REQUIRED',
  'PAYMENT_FAILED',
  'WEBHOOK_INVALID',
  'NODE_NOT_FOUND',
  'NODE_UNAVAILABLE',
  'TUNNEL_FAILED',
  'INTERNAL_ERROR',
]);
```

- [ ] **Шаг 2: Проверить типы**

Run: `bun --filter @gnomevpn/schemas typecheck`
Expected: без ошибок

- [ ] **Шаг 3: Коммит**

```bash
git add packages/schemas/src/errors/codes.ts
git commit -m "feat(schemas): add billing error codes"
```

---

### Задача 2: Схемы auth

**Files:**
- Create: `packages/schemas/src/auth/inputs.ts`
- Create: `packages/schemas/src/auth/types.ts`
- Create: `packages/schemas/src/auth/index.ts`
- Create: `packages/schemas/src/auth/_tests/auth.test.ts`
- Modify: `packages/schemas/src/index.ts`

- [ ] **Шаг 1: Написать падающий тест**

Create `packages/schemas/src/auth/_tests/auth.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { signInSchema, signUpSchema } from '../inputs';

describe('signInSchema', () => {
  it('приводит email к нижнему регистру и обрезает пробелы', () => {
    const parsed = signInSchema.parse({ email: '  ME@Test.LOCAL ', password: 'password123' });

    expect(parsed.email).toBe('me@test.local');
  });

  it('отклоняет пароль короче 8 символов', () => {
    const result = signInSchema.safeParse({ email: 'me@test.local', password: 'short' });

    expect(result.success).toBe(false);
  });
});

describe('signUpSchema', () => {
  it('отклоняет несовпадающие пароли', () => {
    const result = signUpSchema.safeParse({
      name: 'Аня',
      email: 'me@test.local',
      password: 'password123',
      confirmPassword: 'password456',
    });

    expect(result.success).toBe(false);
  });

  it('привязывает ошибку несовпадения к полю confirmPassword', () => {
    const result = signUpSchema.safeParse({
      name: 'Аня',
      email: 'me@test.local',
      password: 'password123',
      confirmPassword: 'password456',
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['confirmPassword']);
    }
  });

  it('принимает валидные данные', () => {
    const result = signUpSchema.safeParse({
      name: 'Аня',
      email: 'me@test.local',
      password: 'password123',
      confirmPassword: 'password123',
    });

    expect(result.success).toBe(true);
  });
});
```

- [ ] **Шаг 2: Убедиться, что тест падает**

Run: `bunx vitest run packages/schemas/src/auth`
Expected: FAIL — `Cannot find module '../inputs'`

- [ ] **Шаг 3: Реализовать схемы**

Create `packages/schemas/src/auth/inputs.ts`:

```ts
import { z } from 'zod';

const emailSchema = z.email('Неверный email').trim().toLowerCase();
const passwordSchema = z.string().min(8, 'Минимум 8 символов');
const nameSchema = z.string().trim().min(2, 'Минимум 2 символа').max(32, 'Максимум 32 символа');

export const signInSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const signUpSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  });
```

Create `packages/schemas/src/auth/types.ts`:

```ts
import type { z } from 'zod';
import type { signInSchema, signUpSchema } from './inputs';

export type SignInValues = z.infer<typeof signInSchema>;
export type SignUpValues = z.infer<typeof signUpSchema>;
```

Create `packages/schemas/src/auth/index.ts`:

```ts
export { signInSchema, signUpSchema } from './inputs';

export type { SignInValues, SignUpValues } from './types';
```

- [ ] **Шаг 4: Подключить в корневой barrel**

Добавить строку в `packages/schemas/src/index.ts` (рядом с существующими экспортами):

```ts
export * from './auth';
```

Если корневой `index.ts` использует явные реэкспорты — добавить в том же стиле:

```ts
export { signInSchema, signUpSchema } from './auth';
export type { SignInValues, SignUpValues } from './auth';
```

- [ ] **Шаг 5: Тест проходит**

Run: `bunx vitest run packages/schemas/src/auth`
Expected: PASS, 4 теста

- [ ] **Шаг 6: Коммит**

```bash
git add packages/schemas/src/auth packages/schemas/src/index.ts
git commit -m "feat(schemas): add sign-in and sign-up schemas"
```

---

### Задача 3: Схемы billing

**Files:**
- Create: `packages/schemas/src/billing/outputs.ts`
- Create: `packages/schemas/src/billing/inputs.ts`
- Create: `packages/schemas/src/billing/types.ts`
- Create: `packages/schemas/src/billing/index.ts`
- Create: `packages/schemas/src/billing/_tests/billing.test.ts`
- Modify: `packages/schemas/src/index.ts`
- Modify: `packages/schemas/src/subscription/outputs.ts`

- [ ] **Шаг 1: Написать падающий тест**

Create `packages/schemas/src/billing/_tests/billing.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { webhookEventSchema } from '../inputs';

describe('webhookEventSchema', () => {
  it('разбирает payment.succeeded', () => {
    const parsed = webhookEventSchema.parse({
      event: 'payment.succeeded',
      object: { id: 'pay-1', status: 'succeeded' },
    });

    expect(parsed.event).toBe('payment.succeeded');
    expect(parsed.object.id).toBe('pay-1');
  });

  it('отклоняет неизвестное событие', () => {
    const result = webhookEventSchema.safeParse({
      event: 'payment.exploded',
      object: { id: 'pay-1', status: 'succeeded' },
    });

    expect(result.success).toBe(false);
  });

  it('требует id платежа', () => {
    const result = webhookEventSchema.safeParse({
      event: 'payment.succeeded',
      object: { status: 'succeeded' },
    });

    expect(result.success).toBe(false);
  });
});
```

- [ ] **Шаг 2: Убедиться, что тест падает**

Run: `bunx vitest run packages/schemas/src/billing`
Expected: FAIL — модуль не найден

- [ ] **Шаг 3: Реализовать схемы**

Create `packages/schemas/src/billing/inputs.ts`:

```ts
import { z } from 'zod';

export const webhookEventSchema = z.object({
  event: z.enum(['payment.succeeded', 'payment.canceled', 'payment.waiting_for_capture']),
  object: z.object({
    id: z.string().min(1),
    status: z.string().min(1),
  }),
});
```

Create `packages/schemas/src/billing/outputs.ts`:

```ts
import { z } from 'zod';

export const checkoutResultSchema = z.object({
  confirmationUrl: z.url(),
});
```

Create `packages/schemas/src/billing/types.ts`:

```ts
import type { z } from 'zod';
import type { webhookEventSchema } from './inputs';
import type { checkoutResultSchema } from './outputs';

export type WebhookEvent = z.infer<typeof webhookEventSchema>;
export type CheckoutResult = z.infer<typeof checkoutResultSchema>;
```

Create `packages/schemas/src/billing/index.ts`:

```ts
export { webhookEventSchema } from './inputs';
export { checkoutResultSchema } from './outputs';

export type { CheckoutResult, WebhookEvent } from './types';
```

- [ ] **Шаг 4: Расширить схему статуса подписки**

Modify `packages/schemas/src/subscription/outputs.ts`:

```ts
import { z } from 'zod';

export const subscriptionStatusSchema = z.object({
  status: z.enum(['active', 'expired', 'canceled']),
  currentPeriodEnd: z.string().nullable(),
  cancelAtPeriodEnd: z.boolean(),
});
```

- [ ] **Шаг 5: Подключить в корневой barrel**

Добавить в `packages/schemas/src/index.ts` в том же стиле, что и остальные экспорты:

```ts
export { checkoutResultSchema, webhookEventSchema } from './billing';
export type { CheckoutResult, WebhookEvent } from './billing';
```

- [ ] **Шаг 6: Тест проходит**

Run: `bunx vitest run packages/schemas/src/billing`
Expected: PASS, 3 теста

- [ ] **Шаг 7: Коммит**

```bash
git add packages/schemas/src/billing packages/schemas/src/subscription packages/schemas/src/index.ts
git commit -m "feat(schemas): add billing schemas and cancelAtPeriodEnd"
```

---

### Задача 4: Миграция БД

**Files:**
- Modify: `apps/server/prisma/schema.prisma`

- [ ] **Шаг 1: Добавить поля в Subscription**

Найти `model Subscription` и заменить целиком на:

```prisma
model Subscription {
  id               String             @id @default(dbgenerated("gen_random_uuid()"))
  userId           String             @unique @map("user_id")
  status           SubscriptionStatus @default(expired)
  currentPeriodEnd DateTime?          @map("current_period_end") @db.Timestamptz(3)

  yookassaPaymentMethodId String? @map("yookassa_payment_method_id")
  yookassaCustomerId      String? @map("yookassa_customer_id")
  cancelAtPeriodEnd       Boolean @default(false) @map("cancel_at_period_end")

  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(3)
  updatedAt DateTime @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(3)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("subscription")
}
```

- [ ] **Шаг 2: Добавить модель Payment**

Дописать в конец файла:

```prisma
enum PaymentStatus {
  pending
  succeeded
  canceled
}

model Payment {
  id                String        @id @default(dbgenerated("gen_random_uuid()"))
  userId            String        @map("user_id")
  yookassaPaymentId String        @unique @map("yookassa_payment_id")
  amount            Decimal       @map("amount") @db.Decimal(10, 2)
  status            PaymentStatus @default(pending)
  isRecurring       Boolean       @default(false) @map("is_recurring")
  createdAt         DateTime      @default(now()) @map("created_at") @db.Timestamptz(3)
  user              User          @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("payment")
}
```

- [ ] **Шаг 3: Добавить связь в User**

В `model User` дописать строку рядом с `subscription`:

```prisma
  payments      Payment[]
```

- [ ] **Шаг 4: Применить миграцию**

Run: `cd apps/server && bun run db:push`
Expected: `Your database is now in sync with your Prisma schema`

- [ ] **Шаг 5: Проверить таблицу**

Run: `docker exec gnomevpn-postgres-dev psql -U gnomevpn -d gnomevpn -c "\d payment"`
Expected: таблица с колонкой `yookassa_payment_id` и уникальным индексом

- [ ] **Шаг 6: Коммит**

```bash
git add apps/server/prisma/schema.prisma
git commit -m "feat(db): add Payment model and subscription billing fields"
```

---

### Задача 5: Новый юзер без подписки

**Files:**
- Modify: `apps/server/src/modules/auth/auth.ts`

- [ ] **Шаг 1: Изменить хук регистрации**

Заменить блок `databaseHooks`:

```ts
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await basePrisma.subscription.create({
            data: { userId: user.id, status: 'expired' },
          });
        },
      },
    },
  },
```

- [ ] **Шаг 2: Проверить типы**

Run: `bun --filter @gnomevpn/server typecheck`
Expected: без ошибок

- [ ] **Шаг 3: Коммит**

```bash
git add apps/server/src/modules/auth/auth.ts
git commit -m "feat(auth): new users start without an active subscription"
```

---

# Блок 2. Гейт подписки

### Задача 6: Реальная проверка доступа

**Files:**
- Modify: `apps/server/src/modules/subscription/subscription.service.ts`
- Modify: `apps/server/src/modules/subscription/_tests/subscription.service.test.ts`

- [ ] **Шаг 1: Написать падающие тесты**

Дописать в `apps/server/src/modules/subscription/_tests/subscription.service.test.ts` внутрь существующего `describe`:

```ts
  describe('hasActiveAccess', () => {
    const makeService = (row: unknown) => {
      const prisma = {
        subscription: { findUnique: async () => row },
      };

      return new SubscriptionService(prisma as never);
    };

    it('отказывает, когда подписки нет', async () => {
      const service = makeService(null);

      expect(await service.hasActiveAccess('user-1')).toBe(false);
    });

    it('отказывает при status=expired', async () => {
      const service = makeService({
        status: 'expired',
        currentPeriodEnd: new Date(Date.now() + 86_400_000),
      });

      expect(await service.hasActiveAccess('user-1')).toBe(false);
    });

    it('отказывает, когда период истёк', async () => {
      const service = makeService({
        status: 'active',
        currentPeriodEnd: new Date(Date.now() - 1000),
      });

      expect(await service.hasActiveAccess('user-1')).toBe(false);
    });

    it('отказывает, когда currentPeriodEnd пуст', async () => {
      const service = makeService({ status: 'active', currentPeriodEnd: null });

      expect(await service.hasActiveAccess('user-1')).toBe(false);
    });

    it('пропускает активную подписку с будущим периодом', async () => {
      const service = makeService({
        status: 'active',
        currentPeriodEnd: new Date(Date.now() + 86_400_000),
      });

      expect(await service.hasActiveAccess('user-1')).toBe(true);
    });
  });
```

- [ ] **Шаг 2: Убедиться, что тесты падают**

Run: `bunx vitest run apps/server/src/modules/subscription`
Expected: FAIL — заглушка возвращает `true` во всех случаях, 4 теста красные

- [ ] **Шаг 3: Реализовать проверку**

Заменить метод `hasActiveAccess` в `subscription.service.ts`:

```ts
  async hasActiveAccess(userId: string): Promise<boolean> {
    const row = await this.prisma.subscription.findUnique({
      where: { userId },
      select: { status: true, currentPeriodEnd: true },
    });

    if (!row || row.status !== 'active' || !row.currentPeriodEnd) {
      return false;
    }

    return row.currentPeriodEnd.getTime() > Date.now();
  }
```

- [ ] **Шаг 4: Обновить getStatus**

Заменить метод `getStatus` — теперь возвращает `cancelAtPeriodEnd`:

```ts
  async getStatus(userId: string): Promise<SubscriptionStatus> {
    const row = await this.prisma.subscription.findUnique({
      where: { userId },
      select: { status: true, currentPeriodEnd: true, cancelAtPeriodEnd: true },
    });

    if (!row) {
      return { status: 'expired', currentPeriodEnd: null, cancelAtPeriodEnd: false };
    }

    return {
      status: row.status,
      currentPeriodEnd: row.currentPeriodEnd ? row.currentPeriodEnd.toISOString() : null,
      cancelAtPeriodEnd: row.cancelAtPeriodEnd,
    };
  }
```

- [ ] **Шаг 5: Тесты проходят**

Run: `bunx vitest run apps/server/src/modules/subscription`
Expected: PASS

- [ ] **Шаг 6: Коммит**

```bash
git add apps/server/src/modules/subscription
git commit -m "feat(subscription): enforce real access check instead of stub"
```

---

# Блок 3. Клиент ЮKassa

### Задача 7: env-переменные

**Files:**
- Modify: `apps/server/src/config/env.schema.ts`
- Modify: `apps/server/.env.example`
- Modify: `apps/server/.env`

- [ ] **Шаг 1: Расширить схему**

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
  YOOKASSA_SHOP_ID: z.string().default(''),
  YOOKASSA_SECRET_KEY: z.string().default(''),
  YOOKASSA_RETURN_URL: z.url().default('http://localhost:3000/account'),
  SUBSCRIPTION_PRICE_RUB: z.coerce.number().default(100),
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

Ключи ЮKassa имеют `.default('')`, чтобы сервер поднимался без них — оплата вернёт ошибку, но приложение работает.

- [ ] **Шаг 2: Дописать в .env.example**

```bash
# --- ЮKassa ---
# Тестовый магазин: https://yookassa.ru/my/tunes -> раздел «Тестовый магазин».
# Без этих ключей сервер работает, но /billing/checkout вернёт PAYMENT_FAILED.
YOOKASSA_SHOP_ID=
YOOKASSA_SECRET_KEY=
# Куда ЮKassa вернёт юзера после оплаты.
YOOKASSA_RETURN_URL=http://localhost:3000/account
# Цена подписки в рублях за месяц.
SUBSCRIPTION_PRICE_RUB=100
```

- [ ] **Шаг 3: Скопировать те же строки в .env**

Дописать тот же блок в `apps/server/.env` (файл не в git).

- [ ] **Шаг 4: Проверить старт сервера**

Run: `cd apps/server && timeout 15 bun run dev`
Expected: сервер стартует без ошибок валидации env

- [ ] **Шаг 5: Коммит**

```bash
git add apps/server/src/config/env.schema.ts apps/server/.env.example
git commit -m "feat(config): add YooKassa environment variables"
```

---

### Задача 8: HTTP-клиент ЮKassa

**Files:**
- Create: `apps/server/src/lib/yookassa/yookassa.ts`
- Create: `apps/server/src/lib/yookassa/yookassa.types.ts`
- Create: `apps/server/src/lib/yookassa/index.ts`
- Create: `apps/server/src/lib/yookassa/_tests/yookassa.test.ts`
- Modify: `apps/server/src/lib/index.ts`

- [ ] **Шаг 1: Написать падающий тест**

Create `apps/server/src/lib/yookassa/_tests/yookassa.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';

import { YooKassaClient } from '../yookassa';

const makeClient = () =>
  new YooKassaClient({ shopId: 'shop-1', secretKey: 'secret-1' });

afterEach(() => {
  vi.restoreAllMocks();
});

describe('YooKassaClient', () => {
  it('шлёт basic-авторизацию и ключ идемпотентности', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        id: 'pay-1',
        status: 'pending',
        confirmation: { confirmation_url: 'https://pay.test/1' },
      }),
    }));
    vi.stubGlobal('fetch', fetchMock);

    const client = makeClient();
    await client.createPayment({
      amountRub: 100,
      description: 'GnomeVPN',
      returnUrl: 'https://app.test/account',
      idempotenceKey: 'key-1',
      savePaymentMethod: true,
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;

    expect(headers.Authorization).toBe(`Basic ${btoa('shop-1:secret-1')}`);
    expect(headers['Idempotence-Key']).toBe('key-1');
  });

  it('возвращает confirmationUrl и id платежа', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          id: 'pay-1',
          status: 'pending',
          confirmation: { confirmation_url: 'https://pay.test/1' },
        }),
      })),
    );

    const result = await makeClient().createPayment({
      amountRub: 100,
      description: 'GnomeVPN',
      returnUrl: 'https://app.test/account',
      idempotenceKey: 'key-1',
      savePaymentMethod: true,
    });

    expect(result).toEqual({
      id: 'pay-1',
      status: 'pending',
      confirmationUrl: 'https://pay.test/1',
    });
  });

  it('бросает при не-ok ответе', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 400, text: async () => 'bad request' })),
    );

    await expect(
      makeClient().createPayment({
        amountRub: 100,
        description: 'GnomeVPN',
        returnUrl: 'https://app.test/account',
        idempotenceKey: 'key-1',
        savePaymentMethod: true,
      }),
    ).rejects.toThrow();
  });

  it('автосписание шлёт payment_method_id вместо save_payment_method', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ id: 'pay-2', status: 'succeeded' }),
    }));
    vi.stubGlobal('fetch', fetchMock);

    await makeClient().chargeRecurring({
      amountRub: 100,
      description: 'GnomeVPN',
      paymentMethodId: 'pm-1',
      idempotenceKey: 'key-2',
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);

    expect(body.payment_method_id).toBe('pm-1');
    expect(body.save_payment_method).toBeUndefined();
    expect(body.capture).toBe(true);
  });

  it('getPayment запрашивает платёж по id', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        id: 'pay-1',
        status: 'succeeded',
        payment_method: { id: 'pm-1' },
      }),
    }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await makeClient().getPayment('pay-1');

    expect(fetchMock.mock.calls[0][0]).toContain('/payments/pay-1');
    expect(result.status).toBe('succeeded');
    expect(result.paymentMethodId).toBe('pm-1');
  });
});
```

- [ ] **Шаг 2: Убедиться, что тест падает**

Run: `bunx vitest run apps/server/src/lib/yookassa`
Expected: FAIL — модуль не найден

- [ ] **Шаг 3: Типы клиента**

Create `apps/server/src/lib/yookassa/yookassa.types.ts`:

```ts
export type YooKassaClientOptions = {
  shopId: string;
  secretKey: string;
};

export type CreatePaymentInput = {
  amountRub: number;
  description: string;
  returnUrl: string;
  idempotenceKey: string;
  savePaymentMethod: boolean;
};

export type ChargeRecurringInput = {
  amountRub: number;
  description: string;
  paymentMethodId: string;
  idempotenceKey: string;
};

export type CreatePaymentResult = {
  id: string;
  status: string;
  confirmationUrl: string | null;
};

export type PaymentInfo = {
  id: string;
  status: string;
  paymentMethodId: string | null;
};
```

- [ ] **Шаг 4: Реализовать клиент**

Create `apps/server/src/lib/yookassa/yookassa.ts`:

```ts
import type {
  ChargeRecurringInput,
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentInfo,
  YooKassaClientOptions,
} from './yookassa.types';

const API_URL = 'https://api.yookassa.ru/v3';
const CURRENCY = 'RUB';

type PaymentResponse = {
  id: string;
  status: string;
  confirmation?: { confirmation_url?: string };
  payment_method?: { id?: string };
};

export class YooKassaClient {
  private readonly shopId: string;
  private readonly secretKey: string;

  constructor(opts: YooKassaClientOptions) {
    this.shopId = opts.shopId;
    this.secretKey = opts.secretKey;
  }

  private headers(idempotenceKey?: string): Record<string, string> {
    const base: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Basic ${btoa(`${this.shopId}:${this.secretKey}`)}`,
    };

    if (idempotenceKey) {
      base['Idempotence-Key'] = idempotenceKey;
    }

    return base;
  }

  private amount(rub: number) {
    return { value: rub.toFixed(2), currency: CURRENCY };
  }

  private async request(
    path: string,
    init: RequestInit,
    idempotenceKey?: string,
  ): Promise<PaymentResponse> {
    const res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: this.headers(idempotenceKey),
    });

    if (!res.ok) {
      const detail = await res.text();

      throw new Error(`yookassa ${path} failed: ${res.status} ${detail}`);
    }

    return (await res.json()) as PaymentResponse;
  }

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const payload = await this.request(
      '/payments',
      {
        method: 'POST',
        body: JSON.stringify({
          amount: this.amount(input.amountRub),
          description: input.description,
          capture: true,
          save_payment_method: input.savePaymentMethod,
          confirmation: { type: 'redirect', return_url: input.returnUrl },
        }),
      },
      input.idempotenceKey,
    );

    return {
      id: payload.id,
      status: payload.status,
      confirmationUrl: payload.confirmation?.confirmation_url ?? null,
    };
  }

  async chargeRecurring(input: ChargeRecurringInput): Promise<CreatePaymentResult> {
    const payload = await this.request(
      '/payments',
      {
        method: 'POST',
        body: JSON.stringify({
          amount: this.amount(input.amountRub),
          description: input.description,
          capture: true,
          payment_method_id: input.paymentMethodId,
        }),
      },
      input.idempotenceKey,
    );

    return {
      id: payload.id,
      status: payload.status,
      confirmationUrl: null,
    };
  }

  async getPayment(paymentId: string): Promise<PaymentInfo> {
    const payload = await this.request(`/payments/${paymentId}`, { method: 'GET' });

    return {
      id: payload.id,
      status: payload.status,
      paymentMethodId: payload.payment_method?.id ?? null,
    };
  }
}
```

Create `apps/server/src/lib/yookassa/index.ts`:

```ts
export { YooKassaClient } from './yookassa';

export type {
  ChargeRecurringInput,
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentInfo,
} from './yookassa.types';
```

- [ ] **Шаг 5: Подключить в barrel lib**

Дописать в `apps/server/src/lib/index.ts` в стиле существующих строк:

```ts
export { YooKassaClient } from './yookassa';
```

- [ ] **Шаг 6: Тесты проходят**

Run: `bunx vitest run apps/server/src/lib/yookassa`
Expected: PASS, 5 тестов

- [ ] **Шаг 7: Коммит**

```bash
git add apps/server/src/lib/yookassa apps/server/src/lib/index.ts
git commit -m "feat(server): add YooKassa HTTP client"
```

---

# Блок 4. Модуль billing

### Задача 9: BillingService — создание платежа

**Files:**
- Create: `apps/server/src/modules/billing/billing.service.ts`
- Create: `apps/server/src/modules/billing/_tests/billing.service.test.ts`

- [ ] **Шаг 1: Написать падающий тест**

Create `apps/server/src/modules/billing/_tests/billing.service.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';

import { BillingService } from '../billing.service';

const makeConfig = () => ({
  YOOKASSA_SHOP_ID: 'shop-1',
  YOOKASSA_SECRET_KEY: 'secret-1',
  YOOKASSA_RETURN_URL: 'https://app.test/account',
  SUBSCRIPTION_PRICE_RUB: 100,
});

const makePrisma = () => ({
  payment: {
    create: vi.fn(async () => ({ id: 'row-1' })),
    findUnique: vi.fn(async () => null),
    update: vi.fn(async () => ({ id: 'row-1' })),
  },
  subscription: {
    findUnique: vi.fn(async () => null),
    update: vi.fn(async () => ({ id: 'sub-1' })),
    upsert: vi.fn(async () => ({ id: 'sub-1' })),
  },
});

describe('BillingService.createCheckout', () => {
  it('возвращает confirmationUrl и пишет pending-платёж', async () => {
    const prisma = makePrisma();
    const yookassa = {
      createPayment: vi.fn(async () => ({
        id: 'pay-1',
        status: 'pending',
        confirmationUrl: 'https://pay.test/1',
      })),
    };

    const service = new BillingService(prisma as never, makeConfig() as never);
    service.makeClient = () => yookassa as never;

    const result = await service.createCheckout('user-1');

    expect(result.confirmationUrl).toBe('https://pay.test/1');
    expect(prisma.payment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          yookassaPaymentId: 'pay-1',
          status: 'pending',
          isRecurring: false,
        }),
      }),
    );
  });

  it('просит ЮKassa сохранить способ оплаты для рекуррента', async () => {
    const prisma = makePrisma();
    const yookassa = {
      createPayment: vi.fn(async () => ({
        id: 'pay-1',
        status: 'pending',
        confirmationUrl: 'https://pay.test/1',
      })),
    };

    const service = new BillingService(prisma as never, makeConfig() as never);
    service.makeClient = () => yookassa as never;

    await service.createCheckout('user-1');

    expect(yookassa.createPayment).toHaveBeenCalledWith(
      expect.objectContaining({ savePaymentMethod: true, amountRub: 100 }),
    );
  });

  it('бросает PAYMENT_FAILED, когда ЮKassa не вернула ссылку', async () => {
    const prisma = makePrisma();
    const yookassa = {
      createPayment: vi.fn(async () => ({
        id: 'pay-1',
        status: 'pending',
        confirmationUrl: null,
      })),
    };

    const service = new BillingService(prisma as never, makeConfig() as never);
    service.makeClient = () => yookassa as never;

    await expect(service.createCheckout('user-1')).rejects.toThrow();
  });
});
```

- [ ] **Шаг 2: Убедиться, что тест падает**

Run: `bunx vitest run apps/server/src/modules/billing`
Expected: FAIL — модуль не найден

- [ ] **Шаг 3: Реализовать сервис (первая часть)**

Create `apps/server/src/modules/billing/billing.service.ts`:

```ts
import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';

import { AppBadRequestException } from '../../common/exceptions';
import { AppConfigService } from '../../config/config.service';
import { PrismaService } from '../../core';
import { YooKassaClient } from '../../lib';

import type { CheckoutResult } from '@gnomevpn/schemas';

const DESCRIPTION = 'Подписка GnomeVPN на 1 месяц';

@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
  ) {}

  makeClient(): YooKassaClient {
    return new YooKassaClient({
      shopId: this.config.get('YOOKASSA_SHOP_ID'),
      secretKey: this.config.get('YOOKASSA_SECRET_KEY'),
    });
  }

  private priceRub(): number {
    return this.config.get('SUBSCRIPTION_PRICE_RUB');
  }

  async createCheckout(userId: string): Promise<CheckoutResult> {
    const payment = await this.makeClient().createPayment({
      amountRub: this.priceRub(),
      description: DESCRIPTION,
      returnUrl: this.config.get('YOOKASSA_RETURN_URL'),
      idempotenceKey: randomUUID(),
      savePaymentMethod: true,
    });

    await this.prisma.payment.create({
      data: {
        userId,
        yookassaPaymentId: payment.id,
        amount: this.priceRub(),
        status: 'pending',
        isRecurring: false,
      },
    });

    if (!payment.confirmationUrl) {
      throw new AppBadRequestException('PAYMENT_FAILED', 'Не удалось создать платёж');
    }

    return { confirmationUrl: payment.confirmationUrl };
  }
}
```

Проверить точное имя и API `AppConfigService` в `apps/server/src/config/` — если сервис называется иначе или метод не `get`, привести вызовы в соответствие с существующим кодом.

- [ ] **Шаг 4: Тесты проходят**

Run: `bunx vitest run apps/server/src/modules/billing`
Expected: PASS, 3 теста

- [ ] **Шаг 5: Коммит**

```bash
git add apps/server/src/modules/billing
git commit -m "feat(billing): add checkout creation"
```

---

### Задача 10: BillingService — обработка вебхука

**Files:**
- Modify: `apps/server/src/modules/billing/billing.service.ts`
- Modify: `apps/server/src/modules/billing/_tests/billing.service.test.ts`

- [ ] **Шаг 1: Написать падающие тесты**

Дописать в тот же тест-файл:

```ts
describe('BillingService.handleWebhook', () => {
  const succeededEvent = {
    event: 'payment.succeeded' as const,
    object: { id: 'pay-1', status: 'succeeded' },
  };

  it('активирует подписку на месяц от текущего момента', async () => {
    const prisma = makePrisma();
    prisma.payment.findUnique = vi.fn(async () => ({
      id: 'row-1',
      userId: 'user-1',
      status: 'pending',
    }));
    prisma.subscription.findUnique = vi.fn(async () => ({
      status: 'expired',
      currentPeriodEnd: null,
    }));

    const service = new BillingService(prisma as never, makeConfig() as never);
    service.makeClient = () =>
      ({
        getPayment: async () => ({ id: 'pay-1', status: 'succeeded', paymentMethodId: 'pm-1' }),
      }) as never;

    await service.handleWebhook(succeededEvent);

    const update = prisma.subscription.update.mock.calls[0][0] as {
      data: { status: string; currentPeriodEnd: Date; yookassaPaymentMethodId: string };
    };

    expect(update.data.status).toBe('active');
    expect(update.data.yookassaPaymentMethodId).toBe('pm-1');
    expect(update.data.currentPeriodEnd.getTime()).toBeGreaterThan(Date.now());
  });

  it('продлевает от currentPeriodEnd, если он ещё не истёк', async () => {
    const futureEnd = new Date(Date.now() + 10 * 86_400_000);
    const prisma = makePrisma();
    prisma.payment.findUnique = vi.fn(async () => ({
      id: 'row-1',
      userId: 'user-1',
      status: 'pending',
    }));
    prisma.subscription.findUnique = vi.fn(async () => ({
      status: 'active',
      currentPeriodEnd: futureEnd,
    }));

    const service = new BillingService(prisma as never, makeConfig() as never);
    service.makeClient = () =>
      ({
        getPayment: async () => ({ id: 'pay-1', status: 'succeeded', paymentMethodId: 'pm-1' }),
      }) as never;

    await service.handleWebhook(succeededEvent);

    const update = prisma.subscription.update.mock.calls[0][0] as {
      data: { currentPeriodEnd: Date };
    };

    expect(update.data.currentPeriodEnd.getTime()).toBeGreaterThan(futureEnd.getTime());
  });

  it('игнорирует повторную доставку уже обработанного платежа', async () => {
    const prisma = makePrisma();
    prisma.payment.findUnique = vi.fn(async () => ({
      id: 'row-1',
      userId: 'user-1',
      status: 'succeeded',
    }));

    const service = new BillingService(prisma as never, makeConfig() as never);
    service.makeClient = () =>
      ({
        getPayment: async () => ({ id: 'pay-1', status: 'succeeded', paymentMethodId: 'pm-1' }),
      }) as never;

    await service.handleWebhook(succeededEvent);

    expect(prisma.subscription.update).not.toHaveBeenCalled();
  });

  it('не активирует подписку, если API ЮKassa не подтверждает успех', async () => {
    const prisma = makePrisma();
    prisma.payment.findUnique = vi.fn(async () => ({
      id: 'row-1',
      userId: 'user-1',
      status: 'pending',
    }));

    const service = new BillingService(prisma as never, makeConfig() as never);
    service.makeClient = () =>
      ({
        getPayment: async () => ({ id: 'pay-1', status: 'pending', paymentMethodId: null }),
      }) as never;

    await service.handleWebhook(succeededEvent);

    expect(prisma.subscription.update).not.toHaveBeenCalled();
  });

  it('игнорирует платёж, которого нет в нашей базе', async () => {
    const prisma = makePrisma();
    prisma.payment.findUnique = vi.fn(async () => null);

    const service = new BillingService(prisma as never, makeConfig() as never);
    service.makeClient = () =>
      ({
        getPayment: async () => ({ id: 'pay-1', status: 'succeeded', paymentMethodId: 'pm-1' }),
      }) as never;

    await service.handleWebhook(succeededEvent);

    expect(prisma.subscription.update).not.toHaveBeenCalled();
  });
});
```

- [ ] **Шаг 2: Убедиться, что тесты падают**

Run: `bunx vitest run apps/server/src/modules/billing`
Expected: FAIL — `handleWebhook is not a function`

- [ ] **Шаг 3: Реализовать обработчик**

Дописать методы в `BillingService`:

```ts
  private addMonth(from: Date): Date {
    const next = new Date(from);

    next.setMonth(next.getMonth() + 1);

    return next;
  }

  private async activate(userId: string, paymentMethodId: string | null): Promise<void> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
      select: { currentPeriodEnd: true },
    });

    const now = new Date();
    const current = subscription?.currentPeriodEnd;
    const base = current && current.getTime() > now.getTime() ? current : now;

    await this.prisma.subscription.update({
      where: { userId },
      data: {
        status: 'active',
        currentPeriodEnd: this.addMonth(base),
        ...(paymentMethodId ? { yookassaPaymentMethodId: paymentMethodId } : {}),
      },
    });
  }

  async handleWebhook(event: WebhookEvent): Promise<void> {
    const row = await this.prisma.payment.findUnique({
      where: { yookassaPaymentId: event.object.id },
      select: { id: true, userId: true, status: true },
    });

    if (!row || row.status === 'succeeded') {
      return;
    }

    const payment = await this.makeClient().getPayment(event.object.id);

    if (payment.status !== 'succeeded') {
      return;
    }

    await this.prisma.payment.update({
      where: { id: row.id },
      data: { status: 'succeeded' },
    });

    await this.activate(row.userId, payment.paymentMethodId);
  }
```

Добавить в импорты типов файла:

```ts
import type { CheckoutResult, WebhookEvent } from '@gnomevpn/schemas';
```

- [ ] **Шаг 4: Тесты проходят**

Run: `bunx vitest run apps/server/src/modules/billing`
Expected: PASS, 8 тестов

- [ ] **Шаг 5: Коммит**

```bash
git add apps/server/src/modules/billing
git commit -m "feat(billing): handle payment.succeeded webhook idempotently"
```

---

### Задача 11: Отмена автопродления

**Files:**
- Modify: `apps/server/src/modules/billing/billing.service.ts`
- Modify: `apps/server/src/modules/billing/_tests/billing.service.test.ts`

- [ ] **Шаг 1: Написать падающий тест**

```ts
describe('BillingService.cancelAutoRenew', () => {
  it('ставит флаг отмены, не трогая статус', async () => {
    const prisma = makePrisma();
    const service = new BillingService(prisma as never, makeConfig() as never);

    await service.cancelAutoRenew('user-1');

    expect(prisma.subscription.update).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      data: { cancelAtPeriodEnd: true },
    });
  });
});
```

- [ ] **Шаг 2: Убедиться, что падает**

Run: `bunx vitest run apps/server/src/modules/billing`
Expected: FAIL — `cancelAutoRenew is not a function`

- [ ] **Шаг 3: Реализовать**

```ts
  async cancelAutoRenew(userId: string): Promise<void> {
    await this.prisma.subscription.update({
      where: { userId },
      data: { cancelAtPeriodEnd: true },
    });
  }
```

- [ ] **Шаг 4: Тесты проходят**

Run: `bunx vitest run apps/server/src/modules/billing`
Expected: PASS, 9 тестов

- [ ] **Шаг 5: Коммит**

```bash
git add apps/server/src/modules/billing
git commit -m "feat(billing): add auto-renew cancellation"
```

---

### Задача 12: Контроллер и модуль billing

**Files:**
- Create: `apps/server/src/modules/billing/dto/billing.dto.ts`
- Create: `apps/server/src/modules/billing/billing.controller.ts`
- Create: `apps/server/src/modules/billing/billing.module.ts`
- Modify: `apps/server/src/app.module.ts`

- [ ] **Шаг 1: DTO**

Create `apps/server/src/modules/billing/dto/billing.dto.ts`:

```ts
import { checkoutResultSchema, webhookEventSchema } from '@gnomevpn/schemas';
import { createZodDto } from 'nestjs-zod';

export class CheckoutResultDto extends createZodDto(checkoutResultSchema) {}

export class WebhookEventDto extends createZodDto(webhookEventSchema) {}
```

- [ ] **Шаг 2: Контроллер**

Create `apps/server/src/modules/billing/billing.controller.ts`:

```ts
import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { Public } from '@thallesp/nestjs-better-auth';
import { ZodResponse } from 'nestjs-zod';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { BillingService } from './billing.service';
import { CheckoutResultDto, WebhookEventDto } from './dto/billing.dto';

@Controller('billing')
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Post('checkout')
  @ZodResponse({ type: CheckoutResultDto })
  createCheckout(@CurrentUser() userId: string) {
    return this.billing.createCheckout(userId);
  }

  @Post('cancel')
  @HttpCode(204)
  cancelAutoRenew(@CurrentUser() userId: string) {
    return this.billing.cancelAutoRenew(userId);
  }

  @Public()
  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(@Body() body: WebhookEventDto) {
    await this.billing.handleWebhook(body);

    return { received: true };
  }
}
```

Вебхук всегда отвечает 200 — иначе ЮKassa будет ретраить доставку. Ошибки обработки не должны превращаться в бесконечные повторы.

Проверить в `apps/server/src/modules/auth/` или в документации `@thallesp/nestjs-better-auth`, что декоратор публичного роута называется именно `Public`. Если имя другое — использовать актуальное.

- [ ] **Шаг 3: Модуль**

Create `apps/server/src/modules/billing/billing.module.ts`:

```ts
import { Module } from '@nestjs/common';

import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';

@Module({
  controllers: [BillingController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
```

- [ ] **Шаг 4: Зарегистрировать в app.module**

В `apps/server/src/app.module.ts` добавить импорт и запись в массив `imports` после `SubscriptionModule`:

```ts
import { BillingModule } from './modules/billing/billing.module';
```

```ts
    SubscriptionModule,
    BillingModule,
```

- [ ] **Шаг 5: Проверить типы и старт**

Run: `bun --filter @gnomevpn/server typecheck`
Expected: без ошибок

Run: `cd apps/server && timeout 15 bun run dev`
Expected: сервер стартует, в логах маршруты `/billing/checkout`, `/billing/webhook`

- [ ] **Шаг 6: Коммит**

```bash
git add apps/server/src/modules/billing apps/server/src/app.module.ts
git commit -m "feat(billing): expose checkout, cancel and webhook endpoints"
```

---

### Задача 12б: Проверка источника вебхука

Роут `/billing/webhook` публичный — сессии у ЮKassa нет. Без проверки источника кто угодно
может отправить `payment.succeeded` и получить подписку. Спека §10 требует IP-allowlist.

**Files:**
- Create: `apps/server/src/modules/billing/webhook-ip.guard.ts`
- Create: `apps/server/src/modules/billing/_tests/webhook-ip.guard.test.ts`
- Modify: `apps/server/src/modules/billing/billing.controller.ts`
- Modify: `apps/server/src/modules/billing/billing.module.ts`

- [ ] **Шаг 1: Написать падающий тест**

Create `apps/server/src/modules/billing/_tests/webhook-ip.guard.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { WebhookIpGuard } from '../webhook-ip.guard';

const makeContext = (ip: string) => ({
  switchToHttp: () => ({
    getRequest: () => ({ ip, socket: { remoteAddress: ip } }),
  }),
});

describe('WebhookIpGuard', () => {
  it('пропускает адрес из диапазона ЮKassa', () => {
    const guard = new WebhookIpGuard();

    expect(guard.canActivate(makeContext('185.71.76.10') as never)).toBe(true);
  });

  it('пропускает второй диапазон ЮKassa', () => {
    const guard = new WebhookIpGuard();

    expect(guard.canActivate(makeContext('77.75.156.20') as never)).toBe(true);
  });

  it('отклоняет посторонний адрес', () => {
    const guard = new WebhookIpGuard();

    expect(() => guard.canActivate(makeContext('8.8.8.8') as never)).toThrow();
  });

  it('пропускает localhost для локальной отладки', () => {
    const guard = new WebhookIpGuard();

    expect(guard.canActivate(makeContext('127.0.0.1') as never)).toBe(true);
  });
});
```

- [ ] **Шаг 2: Убедиться, что тест падает**

Run: `bunx vitest run apps/server/src/modules/billing`
Expected: FAIL — модуль `webhook-ip.guard` не найден

- [ ] **Шаг 3: Реализовать гвард**

Create `apps/server/src/modules/billing/webhook-ip.guard.ts`:

```ts
import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';

import { AppForbiddenException } from '../../common/exceptions';

const ALLOWED_PREFIXES = [
  '185.71.76.',
  '185.71.77.',
  '77.75.153.',
  '77.75.154.',
  '77.75.156.',
  '77.75.158.',
  '2a02:5180:',
  '127.0.0.1',
  '::1',
];

@Injectable()
export class WebhookIpGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<{ ip?: string; socket?: { remoteAddress?: string } }>();

    const ip = (request.ip ?? request.socket?.remoteAddress ?? '').replace('::ffff:', '');
    const isAllowed = ALLOWED_PREFIXES.some((prefix) => ip.startsWith(prefix));

    if (!isAllowed) {
      throw new AppForbiddenException('WEBHOOK_INVALID', 'Webhook source not allowed');
    }

    return true;
  }
}
```

Список диапазонов ЮKassa может меняться — актуальный смотреть в их документации
(«Уведомления → IP-адреса»). Localhost оставлен, чтобы вебхук можно было отладить
локально через `curl`.

- [ ] **Шаг 4: Повесить на роут**

В `billing.controller.ts` добавить импорты:

```ts
import { UseGuards } from '@nestjs/common';
import { WebhookIpGuard } from './webhook-ip.guard';
```

И декоратор на метод `handleWebhook`, над `@Public()`:

```ts
  @Public()
  @UseGuards(WebhookIpGuard)
  @Post('webhook')
  @HttpCode(200)
```

В `billing.module.ts` добавить гвард в providers:

```ts
  providers: [BillingService, WebhookIpGuard],
```

С импортом:

```ts
import { WebhookIpGuard } from './webhook-ip.guard';
```

- [ ] **Шаг 5: Тесты проходят**

Run: `bunx vitest run apps/server/src/modules/billing`
Expected: PASS, 13 тестов

- [ ] **Шаг 6: Коммит**

```bash
git add apps/server/src/modules/billing
git commit -m "feat(billing): restrict webhook to YooKassa source addresses"
```

---

# Блок 5. Планировщик

### Задача 13: GC висячих пиров

**Files:**
- Create: `apps/server/src/modules/scheduler/peer-gc.job.ts`
- Create: `apps/server/src/modules/scheduler/_tests/peer-gc.job.test.ts`

- [ ] **Шаг 1: Написать падающий тест**

Create `apps/server/src/modules/scheduler/_tests/peer-gc.job.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';

import { PeerGcJob } from '../peer-gc.job';

const STALE_MS = 15 * 60_000;

const makePeer = (over: Record<string, unknown> = {}) => ({
  id: 'peer-1',
  userId: 'user-1',
  wgEasyClientId: 'client-1',
  createdAt: new Date(Date.now() - STALE_MS - 60_000),
  lastHandshakeAt: null,
  node: { wgEasyUrl: 'http://node.test:51821', wgEasyApiKeyRef: 'WG_KEY_DE' },
  ...over,
});

const makePrisma = (peers: unknown[]) => ({
  activePeer: {
    findMany: vi.fn(async () => peers),
    delete: vi.fn(async () => ({ id: 'peer-1' })),
  },
});

describe('PeerGcJob', () => {
  it('снимает пир без хендшейка старше порога', async () => {
    process.env.WG_KEY_DE = 'secret';
    const prisma = makePrisma([makePeer()]);
    const deleteClient = vi.fn(async () => undefined);

    const job = new PeerGcJob(prisma as never);
    job.makeClient = () => ({ deleteClient, getClientHandshake: async () => null }) as never;

    await job.run();

    expect(deleteClient).toHaveBeenCalledWith('client-1');
    expect(prisma.activePeer.delete).toHaveBeenCalledWith({ where: { id: 'peer-1' } });
  });

  it('не трогает свежий пир, ещё не сделавший хендшейк', async () => {
    process.env.WG_KEY_DE = 'secret';
    const prisma = makePrisma([makePeer({ createdAt: new Date() })]);
    const deleteClient = vi.fn(async () => undefined);

    const job = new PeerGcJob(prisma as never);
    job.makeClient = () => ({ deleteClient, getClientHandshake: async () => null }) as never;

    await job.run();

    expect(deleteClient).not.toHaveBeenCalled();
    expect(prisma.activePeer.delete).not.toHaveBeenCalled();
  });

  it('не трогает пир со свежим хендшейком', async () => {
    process.env.WG_KEY_DE = 'secret';
    const prisma = makePrisma([makePeer()]);
    const deleteClient = vi.fn(async () => undefined);

    const job = new PeerGcJob(prisma as never);
    job.makeClient = () =>
      ({ deleteClient, getClientHandshake: async () => new Date() }) as never;

    await job.run();

    expect(deleteClient).not.toHaveBeenCalled();
  });

  it('пропускает узел без ключа в окружении', async () => {
    process.env.WG_KEY_DE = '';
    const prisma = makePrisma([makePeer()]);
    const deleteClient = vi.fn(async () => undefined);

    const job = new PeerGcJob(prisma as never);
    job.makeClient = () => ({ deleteClient, getClientHandshake: async () => null }) as never;

    await job.run();

    expect(deleteClient).not.toHaveBeenCalled();
  });
});
```

- [ ] **Шаг 2: Убедиться, что тест падает**

Run: `bunx vitest run apps/server/src/modules/scheduler`
Expected: FAIL — модуль не найден

- [ ] **Шаг 3: Реализовать джоб**

Create `apps/server/src/modules/scheduler/peer-gc.job.ts`:

```ts
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { PrismaService } from '../../core';
import { WgEasyClient } from '../../lib';

const STALE_MS = 15 * 60_000;

@Injectable()
export class PeerGcJob {
  constructor(private readonly prisma: PrismaService) {}

  makeClient(baseUrl: string, apiKey: string): WgEasyClient {
    return new WgEasyClient({ baseUrl, apiKey });
  }

  private isStale(createdAt: Date, handshake: Date | null): boolean {
    const last = handshake ?? createdAt;

    return Date.now() - last.getTime() > STALE_MS;
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async run(): Promise<void> {
    const peers = await this.prisma.activePeer.findMany({
      select: {
        id: true,
        wgEasyClientId: true,
        createdAt: true,
        node: { select: { wgEasyUrl: true, wgEasyApiKeyRef: true } },
      },
    });

    for (const peer of peers) {
      const apiKey = process.env[peer.node.wgEasyApiKeyRef];

      if (!apiKey) {
        continue;
      }

      const wg = this.makeClient(peer.node.wgEasyUrl, apiKey);
      const handshake = await wg.getClientHandshake(peer.wgEasyClientId);

      if (!this.isStale(peer.createdAt, handshake)) {
        continue;
      }

      await wg.deleteClient(peer.wgEasyClientId).catch(() => undefined);
      await this.prisma.activePeer.delete({ where: { id: peer.id } });
    }
  }
}
```

- [ ] **Шаг 4: Тесты проходят**

Run: `bunx vitest run apps/server/src/modules/scheduler`
Expected: PASS, 4 теста

- [ ] **Шаг 5: Коммит**

```bash
git add apps/server/src/modules/scheduler
git commit -m "feat(scheduler): collect stale wireguard peers"
```

---

### Задача 14: Автосписания

**Files:**
- Create: `apps/server/src/modules/scheduler/recurring-charge.job.ts`
- Create: `apps/server/src/modules/scheduler/_tests/recurring-charge.job.test.ts`

- [ ] **Шаг 1: Написать падающий тест**

Create `apps/server/src/modules/scheduler/_tests/recurring-charge.job.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';

import { RecurringChargeJob } from '../recurring-charge.job';

const makeConfig = () => ({
  YOOKASSA_SHOP_ID: 'shop-1',
  YOOKASSA_SECRET_KEY: 'secret-1',
  SUBSCRIPTION_PRICE_RUB: 100,
});

const makeSubscription = (over: Record<string, unknown> = {}) => ({
  userId: 'user-1',
  currentPeriodEnd: new Date(Date.now() + 3_600_000),
  yookassaPaymentMethodId: 'pm-1',
  ...over,
});

const makePrisma = (rows: unknown[]) => ({
  subscription: {
    findMany: vi.fn(async () => rows),
    update: vi.fn(async () => ({ id: 'sub-1' })),
  },
  payment: {
    create: vi.fn(async () => ({ id: 'row-1' })),
  },
});

describe('RecurringChargeJob', () => {
  it('списывает по сохранённому способу оплаты', async () => {
    const prisma = makePrisma([makeSubscription()]);
    const chargeRecurring = vi.fn(async () => ({
      id: 'pay-2',
      status: 'succeeded',
      confirmationUrl: null,
    }));

    const job = new RecurringChargeJob(prisma as never, makeConfig() as never);
    job.makeClient = () => ({ chargeRecurring }) as never;

    await job.run();

    expect(chargeRecurring).toHaveBeenCalledWith(
      expect.objectContaining({ paymentMethodId: 'pm-1', amountRub: 100 }),
    );
    expect(prisma.payment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ isRecurring: true, yookassaPaymentId: 'pay-2' }),
      }),
    );
  });

  it('переводит подписку в expired, когда списание не прошло', async () => {
    const prisma = makePrisma([makeSubscription()]);
    const job = new RecurringChargeJob(prisma as never, makeConfig() as never);
    job.makeClient = () =>
      ({
        chargeRecurring: async () => {
          throw new Error('card declined');
        },
      }) as never;

    await job.run();

    expect(prisma.subscription.update).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      data: { status: 'expired' },
    });
  });

  it('переводит в canceled подписку с отменённым автопродлением', async () => {
    const prisma = makePrisma([]);
    const job = new RecurringChargeJob(prisma as never, makeConfig() as never);
    job.makeClient = () => ({ chargeRecurring: vi.fn() }) as never;

    await job.run();

    const where = prisma.subscription.findMany.mock.calls[0][0] as {
      where: { cancelAtPeriodEnd: boolean };
    };

    expect(where.where.cancelAtPeriodEnd).toBe(false);
  });

  it('пропускает подписку без сохранённого способа оплаты', async () => {
    const prisma = makePrisma([makeSubscription({ yookassaPaymentMethodId: null })]);
    const chargeRecurring = vi.fn();

    const job = new RecurringChargeJob(prisma as never, makeConfig() as never);
    job.makeClient = () => ({ chargeRecurring }) as never;

    await job.run();

    expect(chargeRecurring).not.toHaveBeenCalled();
  });
});
```

- [ ] **Шаг 2: Убедиться, что тест падает**

Run: `bunx vitest run apps/server/src/modules/scheduler`
Expected: FAIL — модуль `recurring-charge.job` не найден

- [ ] **Шаг 3: Реализовать джоб**

Create `apps/server/src/modules/scheduler/recurring-charge.job.ts`:

```ts
import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { AppConfigService } from '../../config/config.service';
import { PrismaService } from '../../core';
import { YooKassaClient } from '../../lib';

const RENEW_WINDOW_MS = 24 * 3_600_000;
const DESCRIPTION = 'Продление подписки GnomeVPN';

@Injectable()
export class RecurringChargeJob {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
  ) {}

  makeClient(): YooKassaClient {
    return new YooKassaClient({
      shopId: this.config.get('YOOKASSA_SHOP_ID'),
      secretKey: this.config.get('YOOKASSA_SECRET_KEY'),
    });
  }

  @Cron(CronExpression.EVERY_HOUR)
  async run(): Promise<void> {
    const due = await this.prisma.subscription.findMany({
      where: {
        status: 'active',
        cancelAtPeriodEnd: false,
        currentPeriodEnd: { lt: new Date(Date.now() + RENEW_WINDOW_MS) },
      },
      select: { userId: true, yookassaPaymentMethodId: true },
    });

    const price = this.config.get('SUBSCRIPTION_PRICE_RUB');

    for (const subscription of due) {
      if (!subscription.yookassaPaymentMethodId) {
        continue;
      }

      try {
        const payment = await this.makeClient().chargeRecurring({
          amountRub: price,
          description: DESCRIPTION,
          paymentMethodId: subscription.yookassaPaymentMethodId,
          idempotenceKey: randomUUID(),
        });

        await this.prisma.payment.create({
          data: {
            userId: subscription.userId,
            yookassaPaymentId: payment.id,
            amount: price,
            status: 'pending',
            isRecurring: true,
          },
        });
      } catch {
        await this.prisma.subscription.update({
          where: { userId: subscription.userId },
          data: { status: 'expired' },
        });
      }
    }
  }
}
```

Продление подписки здесь не делается — оно приходит вебхуком `payment.succeeded`, как и при первой оплате. Одна точка активации вместо двух.

- [ ] **Шаг 4: Тесты проходят**

Run: `bunx vitest run apps/server/src/modules/scheduler`
Expected: PASS, 8 тестов

- [ ] **Шаг 5: Коммит**

```bash
git add apps/server/src/modules/scheduler
git commit -m "feat(scheduler): charge recurring subscriptions"
```

---

### Задача 15: Модуль scheduler

**Files:**
- Create: `apps/server/src/modules/scheduler/scheduler.module.ts`
- Modify: `apps/server/src/app.module.ts`
- Modify: `apps/server/package.json`

- [ ] **Шаг 1: Установить @nestjs/schedule**

Run: `cd apps/server && bun add @nestjs/schedule`
Expected: пакет добавлен в dependencies

- [ ] **Шаг 2: Модуль**

Create `apps/server/src/modules/scheduler/scheduler.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { PeerGcJob } from './peer-gc.job';
import { RecurringChargeJob } from './recurring-charge.job';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [PeerGcJob, RecurringChargeJob],
})
export class SchedulerModule {}
```

- [ ] **Шаг 3: Зарегистрировать**

В `apps/server/src/app.module.ts` добавить импорт и запись в `imports` после `BillingModule`:

```ts
import { SchedulerModule } from './modules/scheduler/scheduler.module';
```

```ts
    BillingModule,
    SchedulerModule,
```

- [ ] **Шаг 4: Проверить старт**

Run: `cd apps/server && timeout 20 bun run dev`
Expected: сервер стартует, cron-джобы зарегистрированы без ошибок

- [ ] **Шаг 5: Коммит**

```bash
git add apps/server/src/modules/scheduler apps/server/src/app.module.ts apps/server/package.json
git commit -m "feat(scheduler): register cron module"
```

---

# Блок 6. Примитивы shared/ui

### Задача 16: Атомы Text, Label, Spinner

**Files:**
- Create: `apps/client/shared/ui/atoms/Text/{Text.tsx,Text.types.ts,Text.module.scss,index.ts}`
- Create: `apps/client/shared/ui/atoms/Label/{Label.tsx,Label.types.ts,Label.module.scss,index.ts}`
- Create: `apps/client/shared/ui/atoms/Spinner/{Spinner.tsx,Spinner.types.ts,Spinner.module.scss,index.ts}`
- Create: `apps/client/shared/ui/atoms/index.ts`
- Create: `apps/client/shared/ui/index.ts`

- [ ] **Шаг 1: Text**

`Text.types.ts`:

```ts
import type { ComponentProps } from 'react';

export type TextProps = ComponentProps<'p'> & {
  size?: 'xs' | 'sm' | 'md';
  tone?: 'default' | 'muted' | 'danger' | 'success';
  align?: 'left' | 'center';
};
```

`Text.module.scss`:

```scss
.root {
  margin: 0;
}

.xs {
  font-size: 12px;
}

.sm {
  font-size: 14px;
}

.md {
  font-size: 16px;
}

.muted {
  color: var(--color-text-muted);
}

.danger {
  color: var(--color-danger);
}

.success {
  color: var(--color-success);
}

.center {
  text-align: center;
}
```

`Text.tsx`:

```tsx
import { clsx } from 'clsx';

import s from './Text.module.scss';

import type { TextProps } from './Text.types';

export const Text = ({
  size = 'md',
  tone = 'default',
  align = 'left',
  className,
  children,
  ...props
}: TextProps) => (
  <p
    className={clsx(s.root, s[size], tone !== 'default' && s[tone], align === 'center' && s.center, className)}
    {...props}
  >
    {children}
  </p>
);
```

`index.ts`:

```ts
export { Text } from './Text';

export type { TextProps } from './Text.types';
```

- [ ] **Шаг 2: Label**

`Label.types.ts`:

```ts
import type { ComponentProps } from 'react';

export type LabelProps = ComponentProps<'label'>;
```

`Label.module.scss`:

```scss
.root {
  display: block;
  font-size: 14px;
  color: var(--color-text-muted);
}
```

`Label.tsx`:

```tsx
import { clsx } from 'clsx';

import s from './Label.module.scss';

import type { LabelProps } from './Label.types';

export const Label = ({ className, children, ...props }: LabelProps) => (
  <label className={clsx(s.root, className)} {...props}>
    {children}
  </label>
);
```

`index.ts`:

```ts
export { Label } from './Label';

export type { LabelProps } from './Label.types';
```

- [ ] **Шаг 3: Spinner**

`Spinner.types.ts`:

```ts
export type SpinnerProps = {
  className?: string;
};
```

`Spinner.module.scss`:

```scss
.root {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid currentcolor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
```

`Spinner.tsx`:

```tsx
import { clsx } from 'clsx';

import s from './Spinner.module.scss';

import type { SpinnerProps } from './Spinner.types';

export const Spinner = ({ className }: SpinnerProps) => (
  <span aria-hidden className={clsx(s.root, className)} />
);
```

`index.ts`:

```ts
export { Spinner } from './Spinner';

export type { SpinnerProps } from './Spinner.types';
```

- [ ] **Шаг 4: Barrel атомов**

`apps/client/shared/ui/atoms/index.ts`:

```ts
export { Label } from './Label';
export { Spinner } from './Spinner';
export { Text } from './Text';

export type { LabelProps } from './Label';
export type { SpinnerProps } from './Spinner';
export type { TextProps } from './Text';
```

`apps/client/shared/ui/index.ts`:

```ts
export { Label, Spinner, Text } from './atoms';

export type { LabelProps, SpinnerProps, TextProps } from './atoms';
```

- [ ] **Шаг 5: Проверить типы**

Run: `bun --filter @gnomevpn/client typecheck`
Expected: без ошибок

- [ ] **Шаг 6: Коммит**

```bash
git add apps/client/shared/ui
git commit -m "feat(ui): add Text, Label and Spinner atoms"
```

---

### Задача 17: Атомы Button, Input, PasswordInput

**Files:**
- Create: `apps/client/shared/ui/atoms/Button/{Button.tsx,Button.types.ts,Button.module.scss,index.ts}`
- Create: `apps/client/shared/ui/atoms/Input/{Input.tsx,Input.types.ts,Input.module.scss,index.ts}`
- Create: `apps/client/shared/ui/atoms/PasswordInput/{PasswordInput.tsx,PasswordInput.types.ts,PasswordInput.module.scss,index.ts}`
- Modify: `apps/client/shared/ui/atoms/index.ts`
- Modify: `apps/client/shared/ui/index.ts`

- [ ] **Шаг 1: Button**

`Button.types.ts`:

```ts
import type { ComponentProps } from 'react';

export type ButtonProps = ComponentProps<'button'> & {
  variant?: 'primary' | 'ghost' | 'danger';
  size?: 'md' | 'lg';
};
```

`Button.module.scss`:

```scss
.root {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  font: inherit;
  cursor: pointer;
  border: 1px solid transparent;
  border-radius: 10px;
  transition: opacity 0.15s ease;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
}

.md {
  height: 40px;
  padding: 0 16px;
}

.lg {
  width: 100%;
  height: 48px;
  padding: 0 20px;
}

.primary {
  color: #fff;
  background-color: var(--color-accent);
}

.ghost {
  color: var(--color-text);
  background-color: transparent;
  border-color: var(--color-border);
}

.danger {
  color: #fff;
  background-color: var(--color-danger);
}
```

`Button.tsx`:

```tsx
import { clsx } from 'clsx';

import s from './Button.module.scss';

import type { ButtonProps } from './Button.types';

export const Button = ({
  variant = 'primary',
  size = 'md',
  type = 'button',
  className,
  children,
  ...props
}: ButtonProps) => (
  <button className={clsx(s.root, s[variant], s[size], className)} type={type} {...props}>
    {children}
  </button>
);
```

`index.ts`:

```ts
export { Button } from './Button';

export type { ButtonProps } from './Button.types';
```

- [ ] **Шаг 2: Input**

`Input.types.ts`:

```ts
import type { ComponentProps } from 'react';

export type InputProps = ComponentProps<'input'>;
```

`Input.module.scss`:

```scss
.root {
  width: 100%;
  height: 44px;
  padding: 0 12px;
  font: inherit;
  color: var(--color-text);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 10px;

  &::placeholder {
    color: var(--color-text-muted);
  }

  &:focus-visible {
    border-color: var(--color-accent);
    outline: none;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
}
```

`Input.tsx`:

```tsx
import { clsx } from 'clsx';

import s from './Input.module.scss';

import type { InputProps } from './Input.types';

export const Input = ({ className, type = 'text', ...props }: InputProps) => (
  <input className={clsx(s.root, className)} type={type} {...props} />
);
```

`index.ts`:

```ts
export { Input } from './Input';

export type { InputProps } from './Input.types';
```

- [ ] **Шаг 3: PasswordInput**

`PasswordInput.types.ts`:

```ts
import type { InputProps } from '../Input';

export type PasswordInputProps = Omit<InputProps, 'type'>;
```

`PasswordInput.module.scss`:

```scss
.root {
  position: relative;
}

.input {
  padding-right: 44px;
}

.toggle {
  position: absolute;
  top: 50%;
  right: 8px;
  display: flex;
  padding: 6px;
  color: var(--color-text-muted);
  cursor: pointer;
  background: none;
  border: none;
  transform: translateY(-50%);
}

.icon {
  width: 18px;
  height: 18px;
}
```

`PasswordInput.tsx`:

```tsx
'use client';

import { useBoolean } from '@siberiacancode/reactuse';
import { clsx } from 'clsx';
import { Eye, EyeOff } from 'lucide-react';

import { Input } from '../Input';

import s from './PasswordInput.module.scss';

import type { PasswordInputProps } from './PasswordInput.types';

export const PasswordInput = ({ className, disabled, ...props }: PasswordInputProps) => {
  const [isVisible, toggleVisible] = useBoolean(false);

  return (
    <div className={s.root}>
      <Input
        className={clsx(s.input, className)}
        disabled={disabled}
        type={isVisible ? 'text' : 'password'}
        {...props}
      />

      <button
        aria-label={isVisible ? 'Скрыть пароль' : 'Показать пароль'}
        className={s.toggle}
        disabled={disabled}
        tabIndex={-1}
        type="button"
        onClick={() => toggleVisible()}
      >
        {isVisible ? <EyeOff className={s.icon} /> : <Eye className={s.icon} />}
      </button>
    </div>
  );
};
```

`index.ts`:

```ts
export { PasswordInput } from './PasswordInput';

export type { PasswordInputProps } from './PasswordInput.types';
```

- [ ] **Шаг 4: Обновить barrel атомов**

`apps/client/shared/ui/atoms/index.ts`:

```ts
export { Button } from './Button';
export { Input } from './Input';
export { Label } from './Label';
export { PasswordInput } from './PasswordInput';
export { Spinner } from './Spinner';
export { Text } from './Text';

export type { ButtonProps } from './Button';
export type { InputProps } from './Input';
export type { LabelProps } from './Label';
export type { PasswordInputProps } from './PasswordInput';
export type { SpinnerProps } from './Spinner';
export type { TextProps } from './Text';
```

`apps/client/shared/ui/index.ts`:

```ts
export { Button, Input, Label, PasswordInput, Spinner, Text } from './atoms';

export type {
  ButtonProps,
  InputProps,
  LabelProps,
  PasswordInputProps,
  SpinnerProps,
  TextProps,
} from './atoms';
```

- [ ] **Шаг 5: Проверить типы**

Run: `bun --filter @gnomevpn/client typecheck`
Expected: без ошибок

- [ ] **Шаг 6: Коммит**

```bash
git add apps/client/shared/ui
git commit -m "feat(ui): add Button, Input and PasswordInput atoms"
```

---

### Задача 18: Молекулы FormField и SubmitButton

**Files:**
- Create: `apps/client/shared/ui/molecules/FormField/{FormField.tsx,FormField.types.ts,FormField.module.scss,index.ts}`
- Create: `apps/client/shared/ui/molecules/SubmitButton/{SubmitButton.tsx,SubmitButton.types.ts,index.ts}`
- Create: `apps/client/shared/ui/molecules/index.ts`
- Modify: `apps/client/shared/ui/index.ts`

- [ ] **Шаг 1: FormField**

`FormField.types.ts`:

```ts
import type { ReactNode } from 'react';

export type FormFieldProps = {
  label: ReactNode;
  children: ReactNode;
  error?: ReactNode;
  htmlFor: string;
  className?: string;
};
```

`FormField.module.scss`:

```scss
.root {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
```

`FormField.tsx`:

```tsx
import { clsx } from 'clsx';

import { Label, Text } from '../../atoms';

import s from './FormField.module.scss';

import type { FormFieldProps } from './FormField.types';

export const FormField = ({ label, children, error, htmlFor, className }: FormFieldProps) => (
  <div className={clsx(s.root, className)}>
    <Label htmlFor={htmlFor}>{label}</Label>
    {children}
    {error && (
      <Text role="alert" size="xs" tone="danger">
        {error}
      </Text>
    )}
  </div>
);
```

`index.ts`:

```ts
export { FormField } from './FormField';

export type { FormFieldProps } from './FormField.types';
```

- [ ] **Шаг 2: SubmitButton**

`SubmitButton.types.ts`:

```ts
import type { ButtonProps } from '../../atoms';

export type SubmitButtonProps = ButtonProps & {
  isPending?: boolean;
};
```

`SubmitButton.tsx`:

```tsx
import { Button, Spinner } from '../../atoms';

import type { SubmitButtonProps } from './SubmitButton.types';

export const SubmitButton = ({
  isPending = false,
  disabled,
  size = 'lg',
  type = 'submit',
  children,
  ...props
}: SubmitButtonProps) => (
  <Button disabled={disabled || isPending} size={size} type={type} {...props}>
    {isPending && <Spinner />}
    {children}
  </Button>
);
```

`index.ts`:

```ts
export { SubmitButton } from './SubmitButton';

export type { SubmitButtonProps } from './SubmitButton.types';
```

- [ ] **Шаг 3: Barrel молекул**

`apps/client/shared/ui/molecules/index.ts`:

```ts
export { FormField } from './FormField';
export { SubmitButton } from './SubmitButton';

export type { FormFieldProps } from './FormField';
export type { SubmitButtonProps } from './SubmitButton';
```

`apps/client/shared/ui/index.ts`:

```ts
export { Button, Input, Label, PasswordInput, Spinner, Text } from './atoms';
export { FormField, SubmitButton } from './molecules';

export type {
  ButtonProps,
  InputProps,
  LabelProps,
  PasswordInputProps,
  SpinnerProps,
  TextProps,
} from './atoms';
export type { FormFieldProps, SubmitButtonProps } from './molecules';
```

- [ ] **Шаг 4: Проверить типы**

Run: `bun --filter @gnomevpn/client typecheck`
Expected: без ошибок

- [ ] **Шаг 5: Коммит**

```bash
git add apps/client/shared/ui
git commit -m "feat(ui): add FormField and SubmitButton molecules"
```

---

# Блок 7. Auth на клиенте

### Задача 19: Сущность текущего пользователя

**Files:**
- Create: `apps/client/entities/auth/user/model/hooks/use-current-user.ts`
- Create: `apps/client/entities/auth/user/model/hooks/index.ts`
- Create: `apps/client/entities/auth/user/index.ts`

- [ ] **Шаг 1: Хук**

`use-current-user.ts`:

```ts
'use client';

import { authClient } from '@/shared/api';

export const useCurrentUser = () => {
  const { data: session, isPending } = authClient.useSession();

  const user = session?.user ?? null;

  return {
    user,
    isLoading: isPending,
    isAuthenticated: Boolean(user),
    email: user?.email ?? '',
    name: user?.name ?? '',
  };
};
```

- [ ] **Шаг 2: Barrel'ы**

`model/hooks/index.ts`:

```ts
export { useCurrentUser } from './use-current-user';
```

`entities/auth/user/index.ts`:

```ts
export { useCurrentUser } from './model/hooks';
```

- [ ] **Шаг 3: Проверить типы**

Run: `bun --filter @gnomevpn/client typecheck`
Expected: без ошибок

- [ ] **Шаг 4: Коммит**

```bash
git add apps/client/entities/auth
git commit -m "feat(entities): add current user hook"
```

---

### Задача 20: Слайс sign-in

**Files:**
- Create: `apps/client/features/auth/sign-in/model/use-sign-in.ts`
- Create: `apps/client/features/auth/sign-in/ui/{SignInForm.tsx,SignInForm.module.scss}`
- Create: `apps/client/features/auth/sign-in/index.ts`

- [ ] **Шаг 1: Хук-мутация**

`model/use-sign-in.ts`:

```ts
import { type SignInValues, signInSchema } from '@gnomevpn/schemas';
import { useMutation } from '@tanstack/react-query';

import { authClient } from '@/shared/api';

export type { SignInValues };
export { signInSchema };

export const useSignIn = () => {
  return useMutation({
    mutationFn: async (values: SignInValues) => {
      const { data, error } = await authClient.signIn.email(values);

      if (error) {
        throw new Error(error.message ?? 'Не удалось войти');
      }

      return data;
    },
  });
};
```

- [ ] **Шаг 2: Форма**

`ui/SignInForm.module.scss`:

```scss
.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
```

`ui/SignInForm.tsx`:

```tsx
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { FormField, Input, PasswordInput, SubmitButton } from '@/shared/ui';
import { type SignInValues, signInSchema, useSignIn } from '../model/use-sign-in';

import s from './SignInForm.module.scss';

const DEFAULT_VALUES: SignInValues = { email: '', password: '' };

export const SignInForm = () => {
  const { isPending, mutate } = useSignIn();

  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const onSubmit = handleSubmit((values) => {
    mutate(values, {
      onError: (error: Error) => toast.error(error.message),
    });
  });

  return (
    <form className={s.form} onSubmit={onSubmit}>
      <FormField error={errors.email?.message} htmlFor="signin-email" label="Email">
        <Input autoComplete="email" id="signin-email" type="email" {...register('email')} />
      </FormField>

      <FormField error={errors.password?.message} htmlFor="signin-password" label="Пароль">
        <PasswordInput
          autoComplete="current-password"
          id="signin-password"
          {...register('password')}
        />
      </FormField>

      <SubmitButton isPending={isPending}>Войти</SubmitButton>
    </form>
  );
};
```

Форма не редиректит — этим займётся `AuthProvider` из задачи 23.

- [ ] **Шаг 3: Barrel**

`index.ts`:

```ts
export { SignInForm } from './ui/SignInForm';
```

- [ ] **Шаг 4: Проверить типы**

Run: `bun --filter @gnomevpn/client typecheck`
Expected: без ошибок

- [ ] **Шаг 5: Коммит**

```bash
git add apps/client/features/auth/sign-in
git commit -m "feat(auth): add sign-in form"
```

---

### Задача 21: Слайс sign-up

**Files:**
- Create: `apps/client/features/auth/sign-up/model/use-sign-up.ts`
- Create: `apps/client/features/auth/sign-up/ui/{SignUpForm.tsx,SignUpForm.module.scss}`
- Create: `apps/client/features/auth/sign-up/index.ts`

- [ ] **Шаг 1: Хук-мутация**

`model/use-sign-up.ts`:

```ts
import { type SignUpValues, signUpSchema } from '@gnomevpn/schemas';
import { useMutation } from '@tanstack/react-query';

import { authClient } from '@/shared/api';

export type { SignUpValues };
export { signUpSchema };

export const useSignUp = () => {
  return useMutation({
    mutationFn: async ({ email, password, name }: SignUpValues) => {
      const { data, error } = await authClient.signUp.email({ email, password, name });

      if (error) {
        throw new Error(error.message ?? 'Не удалось зарегистрироваться');
      }

      return data;
    },
  });
};
```

`confirmPassword` отбрасывается деструктуризацией — в API он не нужен.

- [ ] **Шаг 2: Форма**

`ui/SignUpForm.module.scss`:

```scss
.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
```

`ui/SignUpForm.tsx`:

```tsx
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { FormField, Input, PasswordInput, SubmitButton } from '@/shared/ui';
import { type SignUpValues, signUpSchema, useSignUp } from '../model/use-sign-up';

import s from './SignUpForm.module.scss';

const DEFAULT_VALUES: SignUpValues = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
};

export const SignUpForm = () => {
  const { isPending, mutate } = useSignUp();

  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const onSubmit = handleSubmit((values) => {
    mutate(values, {
      onError: (error: Error) => toast.error(error.message),
    });
  });

  return (
    <form className={s.form} onSubmit={onSubmit}>
      <FormField error={errors.name?.message} htmlFor="signup-name" label="Имя">
        <Input autoComplete="name" id="signup-name" {...register('name')} />
      </FormField>

      <FormField error={errors.email?.message} htmlFor="signup-email" label="Email">
        <Input autoComplete="email" id="signup-email" type="email" {...register('email')} />
      </FormField>

      <FormField error={errors.password?.message} htmlFor="signup-password" label="Пароль">
        <PasswordInput autoComplete="new-password" id="signup-password" {...register('password')} />
      </FormField>

      <FormField
        error={errors.confirmPassword?.message}
        htmlFor="signup-confirm"
        label="Повторите пароль"
      >
        <PasswordInput
          autoComplete="new-password"
          id="signup-confirm"
          {...register('confirmPassword')}
        />
      </FormField>

      <SubmitButton isPending={isPending}>Создать аккаунт</SubmitButton>
    </form>
  );
};
```

- [ ] **Шаг 3: Barrel**

`index.ts`:

```ts
export { SignUpForm } from './ui/SignUpForm';
```

- [ ] **Шаг 4: Проверить типы**

Run: `bun --filter @gnomevpn/client typecheck`
Expected: без ошибок

- [ ] **Шаг 5: Коммит**

```bash
git add apps/client/features/auth/sign-up
git commit -m "feat(auth): add sign-up form"
```

---

### Задача 22: Страница /auth

**Files:**
- Create: `apps/client/views/auth/ui/{AuthPage.tsx,AuthPage.types.ts,AuthPage.module.scss}`
- Create: `apps/client/views/auth/index.ts`
- Create: `apps/client/app/auth/page.tsx`
- Create: `apps/client/shared/constants/routes.ts`
- Modify: `apps/client/shared/constants/index.ts`

- [ ] **Шаг 1: Константы маршрутов**

`apps/client/shared/constants/routes.ts`:

```ts
export const ROUTES = {
  landing: '/',
  auth: '/auth',
  account: '/account',
  app: '/app',
} as const;

const PUBLIC_ROUTES: string[] = [ROUTES.landing, ROUTES.auth];

export const isPublicRoute = (pathname: string): boolean => {
  return PUBLIC_ROUTES.includes(pathname);
};
```

`apps/client/shared/constants/index.ts`:

```ts
export { QUERY_KEYS } from './query-keys';
export { ROUTES, isPublicRoute } from './routes';
```

- [ ] **Шаг 2: View**

`AuthPage.types.ts`:

```ts
export type AuthMode = 'signin' | 'signup';
```

`AuthPage.module.scss`:

```scss
.root {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 24px;
}

.panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  max-width: 380px;
  padding: 32px;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
}

.title {
  margin: 0;
  font-size: 24px;
  text-align: center;
}

.toggleButton {
  padding: 0;
  color: var(--color-accent);
  cursor: pointer;
  background: none;
  border: none;
}
```

`AuthPage.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { match } from 'ts-pattern';

import { SignInForm } from '@/features/auth/sign-in';
import { SignUpForm } from '@/features/auth/sign-up';
import { Text } from '@/shared/ui';

import s from './AuthPage.module.scss';

import type { AuthMode } from './AuthPage.types';

export const AuthPage = () => {
  const [mode, setMode] = useState<AuthMode>('signin');

  const isSignUp = mode === 'signup';

  return (
    <main className={s.root}>
      <div className={s.panel}>
        <h1 className={s.title}>{isSignUp ? 'Регистрация' : 'Вход'}</h1>

        <div key={mode}>
          {match(mode)
            .with('signup', () => <SignUpForm />)
            .with('signin', () => <SignInForm />)
            .exhaustive()}
        </div>

        <Text align="center" size="sm" tone="muted">
          {isSignUp ? 'Уже есть аккаунт? ' : 'Нет аккаунта? '}
          <button
            className={s.toggleButton}
            type="button"
            onClick={() => setMode(isSignUp ? 'signin' : 'signup')}
          >
            {isSignUp ? 'Войти' : 'Создать'}
          </button>
        </Text>
      </div>
    </main>
  );
};
```

`views/auth/index.ts`:

```ts
export { AuthPage } from './ui/AuthPage';
```

- [ ] **Шаг 3: Роут**

`apps/client/app/auth/page.tsx`:

```tsx
import { AuthPage } from '@/views/auth';

export const metadata = { title: 'Вход — GnomeVPN' };

const Page = () => <AuthPage />;

export default Page;
```

- [ ] **Шаг 4: Проверить в браузере**

Run: `bun run dev`
Открыть `http://localhost:3000/auth`
Expected: форма входа, переключение на регистрацию работает, валидация показывает ошибки под полями

- [ ] **Шаг 5: Коммит**

```bash
git add apps/client/views/auth apps/client/app/auth apps/client/shared/constants
git commit -m "feat(auth): add auth page with sign-in and sign-up modes"
```

---

### Задача 23: AuthProvider с редиректами

**Files:**
- Create: `apps/client/app/providers/AuthProvider.tsx`
- Modify: `apps/client/app/providers/AppProviders.tsx`

- [ ] **Шаг 1: Провайдер**

`AuthProvider.tsx`:

```tsx
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { match } from 'ts-pattern';

import { useCurrentUser } from '@/entities/auth/user';
import { ROUTES, isPublicRoute } from '@/shared/constants';

import type { ReactNode } from 'react';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();

  const { isLoading, isAuthenticated } = useCurrentUser();

  const hasResolvedRef = useRef(false);

  if (!isLoading) {
    hasResolvedRef.current = true;
  }

  const isInitialLoading = isLoading && !hasResolvedRef.current;
  const isGuestZone = isPublicRoute(pathname);

  const target = match({ isGuestZone, isInitialLoading, isAuthenticated })
    .with({ isInitialLoading: true }, () => null)
    .with({ isGuestZone: true, isAuthenticated: true }, () => ROUTES.account)
    .with({ isGuestZone: false, isAuthenticated: false }, () => ROUTES.auth)
    .otherwise(() => null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: redirect must fire only on target change; router is a stable ref
  useEffect(() => {
    if (target) {
      router.replace(target);
    }
  }, [target]);

  if (isInitialLoading || target) {
    return null;
  }

  return children;
};
```

- [ ] **Шаг 2: Подключить**

`AppProviders.tsx`:

```tsx
'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

import { queryClient } from '@/shared/api';
import { AuthProvider } from './AuthProvider';

import type { ReactNode } from 'react';

export const AppProviders = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>{children}</AuthProvider>
    <Toaster position="top-center" theme="dark" />
  </QueryClientProvider>
);
```

- [ ] **Шаг 3: Проверить поведение**

Run: `bun run dev`

Проверить:
- `/account` без входа → редирект на `/auth`
- после входа → редирект на `/account`
- `/auth` при активной сессии → редирект на `/account`

- [ ] **Шаг 4: Коммит**

```bash
git add apps/client/app/providers
git commit -m "feat(auth): redirect based on session state"
```

---

# Блок 8. Кабинет

### Задача 24: API и сущность подписки

**Files:**
- Modify: `apps/client/shared/api/vpn/vpn.ts`
- Modify: `apps/client/shared/api/index.ts`
- Modify: `apps/client/shared/constants/query-keys.ts`
- Create: `apps/client/entities/billing/subscription/api/use-subscription-status.ts`
- Create: `apps/client/entities/billing/subscription/api/index.ts`
- Create: `apps/client/entities/billing/subscription/index.ts`

- [ ] **Шаг 1: Функции API**

Дописать в `apps/client/shared/api/vpn/vpn.ts`:

```ts
export const createCheckout = async (): Promise<CheckoutResult> => {
  const { data } = await api.post<CheckoutResult>('/billing/checkout');

  return data;
};

export const cancelAutoRenew = async (): Promise<void> => {
  await api.post('/billing/cancel');
};
```

Добавить `CheckoutResult` в импорты типов файла:

```ts
import type { CheckoutResult } from '@gnomevpn/schemas';
```

- [ ] **Шаг 2: Обновить barrel**

`apps/client/shared/api/index.ts`:

```ts
export { authClient, clearToken, getAuthToken, saveAuthToken } from './auth/auth-client';
export { ApiError, api, apiErrorCode, toApiError } from './http';
export { queryClient } from './query-client';
export {
  cancelAutoRenew,
  connectTunnel,
  createCheckout,
  disconnectTunnel,
  getSubscriptionStatus,
  listNodes,
} from './vpn/vpn';
```

- [ ] **Шаг 3: Хук статуса**

`entities/billing/subscription/api/use-subscription-status.ts`:

```ts
'use client';

import { useQuery } from '@tanstack/react-query';

import { getSubscriptionStatus } from '@/shared/api';
import { QUERY_KEYS } from '@/shared/constants';

export const useSubscriptionStatus = () => {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: QUERY_KEYS.subscriptionStatus(),
    queryFn: getSubscriptionStatus,
  });

  return { subscription: data ?? null, isLoading, isError, refetch };
};
```

- [ ] **Шаг 4: Barrel'ы**

`api/index.ts`:

```ts
export { useSubscriptionStatus } from './use-subscription-status';
```

`entities/billing/subscription/index.ts`:

```ts
export { useSubscriptionStatus } from './api';
```

- [ ] **Шаг 5: Проверить типы**

Run: `bun --filter @gnomevpn/client typecheck`
Expected: без ошибок

- [ ] **Шаг 6: Коммит**

```bash
git add apps/client/shared/api apps/client/entities/billing
git commit -m "feat(billing): add subscription status entity and checkout api"
```

---

### Задача 25: Слайс checkout

**Files:**
- Create: `apps/client/features/billing/checkout/model/use-checkout.ts`
- Create: `apps/client/features/billing/checkout/model/use-cancel-auto-renew.ts`
- Create: `apps/client/features/billing/checkout/ui/CheckoutButton.tsx`
- Create: `apps/client/features/billing/checkout/index.ts`

- [ ] **Шаг 1: Мутация оплаты**

`model/use-checkout.ts`:

```ts
import { useMutation } from '@tanstack/react-query';

import { createCheckout } from '@/shared/api';

export const useCheckout = () => {
  return useMutation({
    mutationFn: createCheckout,
    onSuccess: (result) => {
      window.location.href = result.confirmationUrl;
    },
  });
};
```

- [ ] **Шаг 2: Мутация отмены**

`model/use-cancel-auto-renew.ts`:

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { cancelAutoRenew } from '@/shared/api';
import { QUERY_KEYS } from '@/shared/constants';

export const useCancelAutoRenew = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelAutoRenew,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.subscriptionStatus() });
    },
  });
};
```

- [ ] **Шаг 3: Кнопка**

`ui/CheckoutButton.tsx`:

```tsx
'use client';

import { toast } from 'sonner';

import { SubmitButton } from '@/shared/ui';
import { useCheckout } from '../model/use-checkout';

export const CheckoutButton = () => {
  const { isPending, mutate } = useCheckout();

  const onClick = () => {
    mutate(undefined, {
      onError: (error: Error) => toast.error(error.message),
    });
  };

  return (
    <SubmitButton isPending={isPending} type="button" onClick={onClick}>
      Оплатить 100 ₽
    </SubmitButton>
  );
};
```

- [ ] **Шаг 4: Barrel**

`index.ts`:

```ts
export { useCancelAutoRenew } from './model/use-cancel-auto-renew';
export { CheckoutButton } from './ui/CheckoutButton';
```

- [ ] **Шаг 5: Проверить типы**

Run: `bun --filter @gnomevpn/client typecheck`
Expected: без ошибок

- [ ] **Шаг 6: Коммит**

```bash
git add apps/client/features/billing
git commit -m "feat(billing): add checkout button and cancel mutation"
```

---

### Задача 26: Страница /account

**Files:**
- Create: `apps/client/views/account/ui/{AccountPage.tsx,AccountPage.module.scss}`
- Create: `apps/client/views/account/index.ts`
- Modify: `apps/client/app/account/page.tsx`

- [ ] **Шаг 1: View**

`AccountPage.module.scss`:

```scss
.root {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 520px;
  padding: 40px 24px;
  margin: 0 auto;
}

.card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 24px;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
}

.title {
  margin: 0;
  font-size: 24px;
}

.row {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
}
```

`AccountPage.tsx`:

```tsx
'use client';

import { match } from 'ts-pattern';

import { useCurrentUser } from '@/entities/auth/user';
import { useSubscriptionStatus } from '@/entities/billing/subscription';
import { CheckoutButton, useCancelAutoRenew } from '@/features/billing/checkout';
import { authClient, clearToken } from '@/shared/api';
import { Button, Text } from '@/shared/ui';

import s from './AccountPage.module.scss';

const formatDate = (iso: string): string => {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export const AccountPage = () => {
  const { email } = useCurrentUser();
  const { subscription, isLoading } = useSubscriptionStatus();
  const cancel = useCancelAutoRenew();

  const onSignOut = async () => {
    await authClient.signOut();
    clearToken();
  };

  const isActive = subscription?.status === 'active';

  return (
    <main className={s.root}>
      <div className={s.row}>
        <h1 className={s.title}>Личный кабинет</h1>
        <Button variant="ghost" onClick={onSignOut}>
          Выйти
        </Button>
      </div>

      <Text size="sm" tone="muted">
        {email}
      </Text>

      <div className={s.card}>
        {match({ isLoading, isActive })
          .with({ isLoading: true }, () => <Text tone="muted">Загрузка…</Text>)
          .with({ isActive: true }, () => (
            <>
              <Text tone="success">Подписка активна</Text>
              {subscription?.currentPeriodEnd && (
                <Text size="sm" tone="muted">
                  Действует до {formatDate(subscription.currentPeriodEnd)}
                </Text>
              )}
              {subscription?.cancelAtPeriodEnd ? (
                <Text size="sm" tone="muted">
                  Автопродление отключено
                </Text>
              ) : (
                <Button
                  disabled={cancel.isPending}
                  variant="ghost"
                  onClick={() => cancel.mutate()}
                >
                  Отключить автопродление
                </Button>
              )}
            </>
          ))
          .otherwise(() => (
            <>
              <Text>Подписка не активна</Text>
              <Text size="sm" tone="muted">
                100 ₽ в месяц, доступ ко всем странам
              </Text>
              <CheckoutButton />
            </>
          ))}
      </div>
    </main>
  );
};
```

`views/account/index.ts`:

```ts
export { AccountPage } from './ui/AccountPage';
```

- [ ] **Шаг 2: Роут**

`apps/client/app/account/page.tsx`:

```tsx
import { AccountPage } from '@/views/account';

export const metadata = { title: 'Кабинет — GnomeVPN' };

const Page = () => <AccountPage />;

export default Page;
```

- [ ] **Шаг 3: Проверить в браузере**

Run: `bun run dev`

Проверить: регистрация → редирект на `/account` → «Подписка не активна» + кнопка оплаты

- [ ] **Шаг 4: Коммит**

```bash
git add apps/client/views/account apps/client/app/account
git commit -m "feat(account): add subscription dashboard"
```

---

### Задача 27: Реакция на 402 в приложении

**Files:**
- Modify: `apps/client/views/app-view/ui/AppView.tsx`

- [ ] **Шаг 1: Показать причину блокировки**

В `AppView` добавить проверку подписки перед подключением. Импорты:

```tsx
import { useSubscriptionStatus } from '@/entities/billing/subscription';
import { ROUTES } from '@/shared/constants';
import { Button, Text } from '@/shared/ui';
```

Внутри компонента после существующих хуков:

```tsx
  const { subscription } = useSubscriptionStatus();

  const hasAccess = subscription?.status === 'active';
```

Заменить `<ConnectButton ... />` на блок:

```tsx
      {hasAccess ? (
        <ConnectButton status={status} disabled={!effectiveNodeId} onToggle={onToggle} />
      ) : (
        <>
          <Text tone="muted">Нужна подписка</Text>
          <Button onClick={() => window.open(ROUTES.account, '_blank')}>
            Оформить подписку
          </Button>
        </>
      )}
```

- [ ] **Шаг 2: Проверить**

Run: `bun run dev`
Открыть `/app` без подписки
Expected: вместо Connect — «Нужна подписка» и кнопка

- [ ] **Шаг 3: Коммит**

```bash
git add apps/client/views/app-view
git commit -m "feat(app): show subscription gate instead of connect button"
```

---

# Блок 9. Финальная проверка

### Задача 28: Сквозная проверка

- [ ] **Шаг 1: Все тесты**

Run: `bunx vitest run` (из корня)
Expected: все зелёные

Run: `cd apps/server && bunx vitest run`
Expected: все зелёные

- [ ] **Шаг 2: Типы**

Run: `bun run typecheck`
Expected: чисто

- [ ] **Шаг 3: Линтер**

Run: `bun run lint`
Expected: без ошибок (при необходимости `bun run lint:fix`)

- [ ] **Шаг 4: Ручной сценарий**

1. `bun run dev:infra`, затем `bun run dev`
2. Открыть `/auth`, зарегистрироваться
3. Редирект на `/account`, статус «Подписка не активна»
4. Открыть `/app` — вместо Connect кнопка «Оформить подписку»
5. Проверить `402`:

```bash
curl -X POST http://localhost:4000/tunnel/connect \
  -H "Authorization: Bearer <токен>" \
  -H "Content-Type: application/json" \
  -d '{"nodeId":"<id>"}' -i
```

Expected: `HTTP/1.1 402` с телом `{"error":"...","code":"PAYMENT_REQUIRED"}`

6. Симулировать успешную оплату (без боевых ключей ЮKassa):

```bash
docker exec gnomevpn-postgres-dev psql -U gnomevpn -d gnomevpn -c \
  "update subscription set status='active', current_period_end=now() + interval '1 month' where user_id=(select id from \"user\" limit 1);"
```

7. Обновить `/app` — появилась кнопка Connect, туннель поднимается

- [ ] **Шаг 5: Финальный коммит**

```bash
git add -A
git commit -m "chore: stage 2 verification pass"
```

---

## Definition of Done

- [ ] Регистрация и вход работают через UI без curl
- [ ] Новый юзер получает `status=expired`, `/app` показывает гейт
- [ ] `POST /tunnel/connect` без подписки → `402 PAYMENT_REQUIRED`
- [ ] `/account` показывает статус, дату окончания и кнопку оплаты
- [ ] `POST /billing/checkout` возвращает `confirmationUrl` (с ключами ЮKassa)
- [ ] Вебхук с постороннего IP отклоняется
- [ ] Повторный вебхук не продлевает подписку дважды
- [ ] Продление считается от `max(now, currentPeriodEnd)`
- [ ] Отмена автопродления ставит флаг, не трогая статус
- [ ] Рекуррент пропускает подписки с `cancelAtPeriodEnd = true`
- [ ] GC снимает висячий пир, не трогает свежий
- [ ] `bun run typecheck` и `bun run lint` чисты, все тесты зелёные
