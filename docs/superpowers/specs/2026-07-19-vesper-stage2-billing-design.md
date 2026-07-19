# Vesper Этап 2: оплата, кабинет, гейт подписки

**Дата:** 2026-07-19
**Статус:** дизайн
**Зависит от:** Этап 1 MVP (туннель, better-auth, заглушка подписки), провижининг узлов

## 1. Что решаем

Этап 1 дал работающий туннель, но подключиться может кто угодно: `SubscriptionService.hasActiveAccess`
возвращает `true` безусловно. Денег в системе нет, войти в аккаунт через UI невозможно —
`/account` это заглушка с текстом «появится на Этапе 2».

Спека Этапа 2 (§13 design.md):

> **Этап 2: оплата.** Интеграция ЮKassa (создание платежа, вебхук, рекуррент),
> реальный гейт подписки вместо заглушки, веб-кабинет `/account`.

Плюс перенесённое из плана Этапа 1:

> Сборка мусора висячих пиров по `latestHandshake` — cron-задача добавляется в Этап 2
> вместе с планировщиком.

## 2. Объём

**Входит:**

1. Auth-формы (вход, регистрация) — без них кабинет недостижим
2. Веб-кабинет `/account`: статус подписки, оплата, отмена автопродления
3. Интеграция ЮKassa: создание платежа, вебхук, рекуррентные списания
4. Реальный гейт подписки вместо заглушки
5. Cron-планировщик: автосписания + GC висячих пиров

**Не входит:**

- Лендинг `/` (Этап 3)
- Несколько тарифов, промокоды, смена плана
- Восстановление пароля (в Chatovo есть, здесь YAGNI до появления запроса)
- i18n: интерфейс только на русском, тексты в коде напрямую

**Решения, принятые до начала:**

| Вопрос | Решение | Почему |
|---|---|---|
| Тариф | Один: 100₽/месяц | Как в спеке; расширяется позже без слома схемы |
| Новый юзер | Без подписки (`expired`) | Честный гейт: не оплатил — `402` |
| Ключи ЮKassa | Тестовый магазин, HTTP замокан | Боевых ключей нет; код и тесты пишутся полностью |
| i18n | Нет | Аудитория РФ; next-intl тянуть незачем |

## 3. Архитектура

Следуем структуре Chatovo — она отработана и задокументирована в `docs/fsd.md` и `docs/style.md`.

### Backend (NestJS)

Новый модуль `billing`, изменения в `subscription` и `auth`:

```
apps/server/src/modules/
├── billing/
│   ├── billing.module.ts
│   ├── billing.controller.ts      # POST /billing/checkout, POST /billing/webhook
│   ├── billing.service.ts         # бизнес-логика платежей
│   ├── dto/billing.dto.ts         # createZodDto из @vesper/schemas
│   └── _tests/
├── subscription/                   # существует, меняется hasActiveAccess
└── scheduler/
    ├── scheduler.module.ts
    ├── recurring-charge.job.ts     # автосписания
    ├── peer-gc.job.ts              # снятие висячих пиров
    └── _tests/
```

Клиент ЮKassa — в `apps/server/src/lib/yookassa/`, рядом с существующим `lib/wg-easy/`.
Тот же паттерн: класс с типизированными методами, `fetch` внутри, никаких Nest-зависимостей.
Это делает его тестируемым без поднятия модуля.

### Frontend (FSD)

```
apps/client/
├── app/
│   ├── auth/page.tsx                        # роут-обёртка, серверный
│   ├── account/page.tsx                     # существует, наполняется
│   └── providers/AuthProvider.tsx           # редиректы
├── views/
│   ├── auth/ui/AuthPage.tsx                 # 2 режима через ts-pattern
│   └── account/ui/AccountPage.tsx
├── features/
│   ├── auth/sign-in/                        # ui/ + model/use-sign-in.ts
│   ├── auth/sign-up/
│   └── billing/checkout/                    # кнопка оплаты + мутация
├── entities/
│   ├── auth/user/model/hooks/use-current-user.ts
│   └── billing/subscription/                # useSubscriptionStatus
└── shared/ui/
    ├── atoms/{Input,PasswordInput,Button,Label,Text,Spinner}/
    └── molecules/{FormField,SubmitButton}/
```

`shared/ui` в Vesper практически пуст — примитивы создаются с нуля по образцу Chatovo:
SCSS-модули, `clsx`, типы в `<Name>.types.ts`, barrel на каждую папку.

## 4. Модель данных

```prisma
model Subscription {
  id               String             @id @default(dbgenerated("gen_random_uuid()"))
  userId           String             @unique @map("user_id")
  status           SubscriptionStatus @default(expired)
  currentPeriodEnd DateTime?          @map("current_period_end") @db.Timestamptz(3)

  yookassaPaymentMethodId String?     @map("yookassa_payment_method_id")
  yookassaCustomerId      String?     @map("yookassa_customer_id")
  cancelAtPeriodEnd       Boolean     @default(false) @map("cancel_at_period_end")

  createdAt        DateTime           @default(now()) @map("created_at") @db.Timestamptz(3)
  updatedAt        DateTime           @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(3)
  user             User               @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("subscription")
}

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

Два решения в схеме:

**`@unique` на `yookassaPaymentId`** — это и есть механизм идемпотентности вебхука.
Повторная доставка того же события упирается в constraint, обработчик ловит и выходит без
побочных эффектов. Не полагаемся на проверку «а был ли уже такой» отдельным запросом —
между проверкой и записью есть гонка.

**`status` по умолчанию `expired`** — меняется дефолт Этапа 1 (`active`). Соответственно
меняется `databaseHooks.user.create.after` в `auth.ts`: подписка создаётся, но не активная.

## 5. Поток оплаты

```
/account, кнопка «Оплатить 100₽»
  │
  ├─→ POST /billing/checkout
  │     BillingService.createCheckout(userId)
  │       → YooKassaClient.createPayment({
  │           amount: 100.00 RUB,
  │           save_payment_method: true,      // токен для рекуррента
  │           confirmation: { type: 'redirect', return_url },
  │           Idempotence-Key: uuid
  │         })
  │       → Payment(status=pending) в БД
  │     ← { confirmationUrl }
  │
  ├─→ браузер уходит на confirmationUrl (страница ЮKassa)
  │
  ├─→ [юзер платит]
  │
  ├─→ ЮKassa → POST /billing/webhook       ← ЕДИНСТВЕННЫЙ источник правды
  │     проверка подлинности (IP-allowlist ЮKassa)
  │     event=payment.succeeded:
  │       Payment.status = succeeded
  │       Subscription: status=active,
  │                     currentPeriodEnd = max(now, currentPeriodEnd) + 1 месяц,
  │                     yookassaPaymentMethodId = payment_method.id
  │     ← 200 (всегда, даже на дубль — иначе ЮKassa будет ретраить)
  │
  └─→ браузер возвращается на /account?paid=1
        UI показывает «проверяем платёж», перезапрашивает GET /subscription/status
        Редирект НИЧЕГО не активирует — это только подсказка интерфейса
```

Инвариант из спеки §6: **факт оплаты берётся только из вебхука, не из браузерного редиректа.**
Юзер может закрыть вкладку, потерять сеть, подделать `?paid=1` — на состояние подписки
это не влияет никак.

**Продление считается от `max(now, currentPeriodEnd)`**, а не от `now`. Иначе оплата за день
до конца периода сжигала бы остаток.

## 6. Гейт подписки

Меняется одна функция. `SubscriptionGuard`, контроллер и модуль остаются как есть —
спека Этапа 1 специально закладывала эту точку расширения:

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

Смысл трёх статусов, чтобы не было разночтений:

| Статус | Когда ставится | Пускает в туннель |
|---|---|---|
| `active` | оплата прошла | Да, пока `currentPeriodEnd > now` |
| `expired` | новый юзер; период истёк; рекуррент не прошёл | Нет |
| `canceled` | автопродление отменено И период истёк | Нет |

Отмена автопродления **не меняет статус сразу** — ставится только `cancelAtPeriodEnd = true`,
`status` остаётся `active` до конца оплаченного периода. Юзер получает то, за что заплатил.

## 7. Cron-задачи

`@nestjs/schedule`, модуль `scheduler`.

| Джоб | Период | Логика |
|---|---|---|
| `recurring-charge` | раз в час | `active` + `currentPeriodEnd < now + 24ч` + `cancelAtPeriodEnd = false` → списание по `yookassaPaymentMethodId`. Успех → продление. Отказ → `status = expired` |
| `peer-gc` | каждые 10 мин | Для каждого `ActivePeer`: `WgEasyClient.getClientHandshake` (метод уже есть). Нет хендшейка > 15 мин → снять пир в wg-easy и удалить `ActivePeer` |

**Рекуррент идёт через тот же `createPayment`**, но с `payment_method_id` вместо
`save_payment_method` — это автосписание без участия юзера. Результат так же приходит вебхуком,
поэтому продление происходит в одном месте, а не дублируется в джобе.

**GC не трогает свежие пиры:** пир, созданный меньше 15 минут назад и ещё не сделавший
хендшейк, — это нормальный сценарий (юзер нажал Connect и не успел). Порог считается
от `max(createdAt, lastHandshakeAt)`.

## 8. Схемы (`@vesper/schemas`)

```
packages/schemas/src/
├── auth/
│   ├── inputs.ts      # signInSchema, signUpSchema
│   └── types.ts       # SignInValues, SignUpValues
├── billing/
│   ├── inputs.ts      # webhookEventSchema
│   ├── outputs.ts     # checkoutResultSchema
│   └── types.ts
└── subscription/      # существует, дополняется cancelAtPeriodEnd
```

Сообщения валидации — русский текст напрямую (`'Минимум 8 символов'`), не i18n-ключи.
Это осознанное отклонение от Chatovo: там мультиязычность в требованиях, здесь нет.

Схемы живут только в `packages/schemas` и используются с обеих сторон: `zodResolver`
на клиенте и `createZodDto` на сервере. Дублирование запрещено (`style.md` §14).

## 9. Обработка ошибок

Новые коды в `apiErrorCodeSchema`:

| Код | Когда |
|---|---|
| `PAYMENT_REQUIRED` | существует; гейт не пропустил |
| `PAYMENT_FAILED` | ЮKassa отклонила создание платежа |
| `WEBHOOK_INVALID` | вебхук не прошёл проверку подлинности |

На клиенте: `402` на `connect` → модалка «Оформить подписку» со ссылкой на `/account`
(спека §8). В desktop-приложении ссылка открывается во внешнем браузере через Tauri `opener` —
оплата не внутри app.

## 10. Безопасность

- **Вебхук не доверяет телу запроса вслепую:** проверяется источник (IP-диапазоны ЮKassa),
  затем платёж перезапрашивается через API по `id` — состояние берётся из ответа API,
  а не из присланного JSON
- **Идемпотентность** через `@unique` + `Idempotence-Key` на исходящих запросах
- **`/billing/webhook` — публичный роут** (`@Public()`), у ЮKassa нет нашей сессии.
  Именно поэтому проверка подлинности критична
- **Секреты ЮKassa** только в env, валидируются Zod-схемой при старте:
  `YOOKASSA_SHOP_ID`, `YOOKASSA_SECRET_KEY`, `YOOKASSA_RETURN_URL`
- **Rate limiting** на `/auth/*` и `/billing/checkout` через `@nestjs/throttler`

## 11. Тестирование

ЮKassa мокается на уровне HTTP — сетевых запросов в тестах нет.

**Backend:**
- вебхук идемпотентен: повторный `payment.succeeded` не продлевает дважды
- вебхук с чужого IP → отклонён
- продление от `max(now, currentPeriodEnd)`, а не от `now`
- гейт: нет подписки → `402`; истекла → `402`; активна → пропускает
- рекуррент: успех продлевает, отказ переводит в `expired`
- рекуррент не трогает `cancelAtPeriodEnd = true`
- GC: висячий пир снимается, свежий без хендшейка — остаётся

**Frontend:**
- схемы валидации: невалидный email, короткий пароль, несовпадение паролей

## 12. Порядок реализации

Пять блоков, каждый проверяемый отдельно:

1. **Схемы + миграция БД** — Prisma, `@vesper/schemas`, изменение хука регистрации
2. **shared/ui примитивы** — Input, PasswordInput, FormField, SubmitButton, Button, Text
3. **Auth** — слайсы sign-in/sign-up, `views/auth`, AuthProvider с редиректами
4. **Billing** — YooKassaClient, модуль, вебхук, кабинет `/account`
5. **Scheduler** — рекуррент и GC

Гейт включается в блоке 4 — до этого заглушка остаётся, чтобы не сломать работающий туннель.

## 13. Definition of Done

- Регистрация и вход работают через UI, без curl
- Новый юзер: `/app` показывает «нужна подписка», connect отдаёт `402`
- Оплата в тестовом магазине ЮKassa активирует подписку через вебхук
- После активации connect работает, туннель поднимается
- Отмена автопродления: доступ до конца периода, затем `expired`
- Повторный вебхук не продлевает подписку дважды
- Висячий пир снимается GC
- `bun run typecheck` чист, все тесты зелёные
