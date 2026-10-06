# Imports and barrels

Part of the [style guide](../README.md).

## 6. Imports

### Aliases

`@/` → the `apps/client/` root. Used for everything except relatives inside the same folder.

### Group order

`perfectionist/sort-imports` (`bun lint:fix`) sorts imports into groups in this order, **with a blank line between groups**:

1. **External types** — `import type` from packages, including `@gnomevpn/*`.
2. **External values** — packages, `node:` builtins, `@gnomevpn/*`.
3. **Internal types** — `import type` from `@/` aliases.
4. **Internal values** — `@/` aliases.
5. **Relative types** — `import type` from `./` and `../`.
6. **Relative values** — `./` and `../`.
7. **Styles** — `*.css` / `*.scss`.
8. **Side-effect imports** — `import './x'`.

```ts
// features/billing/checkout/ui/PlanPicker.tsx
// 1. external types
import type { PlanId } from '@gnomevpn/schemas';

// 2. external values
import { DEFAULT_PLAN_ID, findPlan, planDiscountPercent, planMonthlyRub, PLANS } from '@gnomevpn/schemas';
import { clsx } from 'clsx';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

// 4. internal values
import { Badge, SelectableCard, Stack, Text } from '@/ui-kit';

// 5. relative types
import type { PlanPickerProps } from './PlanPicker.types';

// 6. relative values
import { CheckoutButton } from './components';

// 7. styles
import s from './PlanPicker.module.scss';
```

The groups come from the `@siberiacancode/eslint` preset, applied in the root `eslint.config.mjs`; `@/` is its internal pattern. In `apps/server` `ts/consistent-type-imports` is off — Nest reads constructor types from decorator metadata, which `import type` erases — so server files usually import types as values.

ESLint inserts the blank lines between groups on `bun lint:fix`; don't strip them by hand.

### Prohibitions

A deep import past a barrel is forbidden:

```ts
// ✗ FORBIDDEN
import { IncyQrDialog } from '@/features/vpn/connect-incy/ui/components/IncyQrDialog';
import { Button } from '@/ui-kit/atoms/Button';

// ✓ OK
import { IncyCard } from '@/features/vpn/connect-incy';
import { Button } from '@/ui-kit';
```

`ui-kit` has a single root barrel, `@/ui-kit` (the atomic layer sits under it). Inside a slice, relative imports are fine.

ESLint does not check FSD boundaries — those are caught at review.

## 7. Barrel exports (`index.ts`)

**A slice:**

```ts
// features/billing/checkout/index.ts
export { useBindCard, useBuyExtraDevices, useCancelAutoRenew, useCheckout, useResumeAutoRenew, useUnbindCard } from './model/hooks';
export { AutoRenewControl, CheckoutButton, ExtraDevicesControl } from './ui/components';
export { PlanPicker } from './ui/PlanPicker';

export type { PlanPickerProps } from './ui/PlanPicker.types';
```

Only what is needed from outside. Internal subcomponents are not exported — `features/vpn/connect-incy` exports `IncyCard` and its two hooks, never `IncyQrDialog` or `OtherAppsList`.

**A component folder:**

```ts
// ui/components/AutoRenewControl/index.ts
export { AutoRenewControl } from './AutoRenewControl';

export type { AutoRenewControlProps } from './AutoRenewControl.types';
```

**A subsystem in `model/`:** when a hook is assembled from several files in a subfolder, the `index.ts` next to them exports only the public entry point. Internal modules and types do not go out.

```ts
// features/auth/telegram-sign-in/model/hooks/use-telegram-login/index.ts
export { useTelegramLogin } from './use-telegram-login';
// not use-telegram-login.helpers.ts or .constants.ts — those stay inside the folder
```

Wildcard exports (`export * from`) are forbidden. Explicit named exports only.
