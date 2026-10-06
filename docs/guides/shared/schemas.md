# Shared schemas

Part of the [style guide](../README.md).

## 14. Shared schemas — `@gnomevpn/schemas`

Zod schemas and the types shared between client and server live in
`packages/schemas`:

Each domain is a folder, and a domain wide enough to hold several concerns
splits again — one folder per concern, never one file holding schemas,
constants and functions together:

```
packages/schemas/src/
  auth/                       ← one concern, files by role
    auth.schemas.ts           ← signInSchema, signUpSchema, changeEmailSchema
    auth.types.ts             ← SignInValues, SignUpValues, ChangeEmailValues
    placeholder-email.ts      ← isPlaceholderEmail, telegramPlaceholderEmail
    index.ts
    _tests/auth.test.ts
  billing/                    ← several concerns, one folder each
    plans/
      plans.constants.ts      ← PLANS, DEFAULT_PLAN_ID, LOWEST_MONTHLY_RUB
      plans.schemas.ts        ← planIdSchema, planSchema
      plans.types.ts          ← Plan, PlanId
      plans.ts                ← findPlan, planMonthlyRub, planDiscountPercent
      index.ts
      _tests/plans.test.ts
    addons/, checkout/, webhook/
    index.ts                  ← re-exports every concern
  tunnel/
    tunnel/                   ← TUNNEL_PROTOCOL, tunnelConfigSchema
  clients/                    ← CLIENT_REGISTRY: third-party apps and their import schemes
  platforms/, subscription/, subscription-link/, telegram/, errors/
```

The suffix says what the file holds, so a reader never opens one to find out:
`.schemas.ts` for zod, `.constants.ts` for data, `.types.ts` for inferred types,
`<name>.ts` for functions. A domain barrel re-exports its concerns; the root
barrel re-exports the domains.

The package exposes a single root entry point — import from `@gnomevpn/schemas`,
not from a subpath:

```ts
// ✓ OK
import type { ChangeEmailValues } from '@gnomevpn/schemas';

import { changeEmailSchema } from '@gnomevpn/schemas';

// ✗ NOT OK
import { SubscriptionLink } from '@/shared/api';
```

`@/shared/api` exports runtime code only — the HTTP wrappers, `ApiError`, the
query client and the better-auth client.

**Form values vs request types.** One Zod schema can yield two types: `.default()`
and `.transform()` make `z.input` and `z.output` incompatible. Where that
happens, name them apart:

- `z.input<typeof schema>` is the shape **before** validation — what
  `defaultValues` holds.
- `z.output<typeof schema>` is the shape **after** it, with defaults applied and
  transforms run — what submit and the API body see.

That axis is the validation stage, not HTTP request versus response. An entity's
response type is its own (`SubscriptionStatus`), never the `z.output` of an input schema.

Most auth schemas have neither a default nor a transform, so a single
`z.infer` type — `ChangeEmailValues` — serves both ends.
