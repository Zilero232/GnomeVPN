# Slice `ui/` and `ui-kit`

Part of the [style guide](../README.md).

## 2. Slice `ui/` structure

**The main component** lives flat in `ui/`, with its files next to it:

```
features/billing/checkout/ui/
  PlanPicker.tsx          ← JSX + entry component
  PlanPicker.types.ts     ← Props and local union types
  PlanPicker.module.scss  ← component styles
  PlanPicker.motion.ts    ← motion presets (when the component is animated —
                            views/account/ui/AccountPage.motion.ts is one)
```

**Subcomponents** (used only inside the parent) — each one in a `components/` folder:

```
features/account/link-telegram/ui/
  TelegramPanel.tsx
  TelegramPanel.module.scss
  components/
    index.ts                   ← barrel: re-exports every subcomponent
    TelegramCode/
      TelegramCode.tsx
      TelegramCode.types.ts
      TelegramCode.module.scss
      index.ts                 ← `export { TelegramCode } from './TelegramCode';`
    TelegramInvite/
      ...
    TelegramLinked/
      ...
    TelegramUnlinkDialog/
      ...
```

The parent imports through the barrel:

```ts
// ✓ OK
import { TelegramCode, TelegramInvite, TelegramLinked, TelegramUnlinkDialog } from './components';

// ✗ NOT OK
import { TelegramCode } from './components/TelegramCode';
```

**File rules:**

- `.types.ts` — created only when there are Props or local union types.
- `.module.scss` — component styles (imported as `import s from './Foo.module.scss'`). Required everywhere: in `ui-kit` as much as in widgets/features/views. There is no CSS-in-JS in this project.
- `.motion.ts` — animation presets for `motion`, next to the component (`AccountPage.motion.ts`). Don't duplicate an animation with a CSS transition.
- `ui-kit/` — the atomic layer (atoms/molecules/organisms). **No flat `button.tsx`** — every primitive lives in a PascalCase folder (§2.1). From outside — `@/ui-kit`.

### 2.1. `ui-kit` structure

Every primitive gets its own folder; there are no flat kebab-case files in `atoms/`, and none should be added.

```
ui-kit/
  index.ts                    ← re-export atoms + molecules + organisms
  atoms/
    index.ts                  ← re-export every atom
    Button/
      Button.tsx
      Button.module.scss
      Button.types.ts         ← optional
      Button.variants.ts      ← optional: variant/size maps
      _tests/                 ← optional: Vitest next to the component
      index.ts                ← export { Button } from './Button';
    Input/
      Input.tsx
      Input.module.scss
      Input.types.ts
      index.ts
  molecules/
    FormField/
      FormField.tsx
      FormField.module.scss
      FormField.types.ts
      index.ts
    Dialog/
      Dialog.tsx
      Dialog.module.scss
      index.ts
  organisms/
    StatusScreen/
      ...
```

**Rules:**

- Component folder and file names are **PascalCase** (`Button/`, `Button.tsx`).
- Styles are **`*.module.scss`**; shared utilities are imported as `@use '@/shared/styles/mixins' as *` (the `@/` alias comes from `loadPaths` + `turbopack.resolveAlias` in `next.config.ts`, so no `../../../`).
- Headless + a11y — **`@base-ui/react`**; imported from the package subpath: `@base-ui/react/dialog`, `@base-ui/react/accordion`, `@base-ui/react/field`, `@base-ui/react/tabs`. Rename the base primitive at the import (`Dialog as BaseDialog`) so our own export can carry the plain name.
- React types are **named imports** (`ComponentProps`, `ReactNode`, …), not `import type * as React`.
- Inside `ui-kit`, imports between layers are relative (`../../atoms/Button`). From outside — only `@/ui-kit`.
- The barrels at all three levels (`atoms/index.ts`, `molecules/index.ts`, `organisms/index.ts` and the root `ui-kit/index.ts`) use **explicit named** re-exports, with values and types in separate blocks.

### Slice barrel

```ts
// features/billing/checkout/index.ts
export { useBindCard, useBuyExtraDevices, useCancelAutoRenew, useCheckout, useResumeAutoRenew, useUnbindCard } from './model/hooks';
export { AutoRenewControl, CheckoutButton, ExtraDevicesControl } from './ui/components';
export { PlanPicker } from './ui/PlanPicker';

export type { PlanPickerProps } from './ui/PlanPicker.types';
```

### Effect hooks instead of a pile of `useEffect` in the component

A side effect with no markup is **its own hook in `model/hooks/`** — it encapsulates the
effect and hands the component only what it renders. The component stays markup:

```tsx
// features/auth/telegram-sign-in/ui/TelegramLoginButton/TelegramLoginButton.tsx
export const TelegramLoginButton = () => {
  const t = useTranslations('auth');
  const { slotRef, isUnreachable, isPending, isError } = useTelegramLogin();

  if (isUnreachable) {
    return null;
  }

  return (
    <div className={s.root}>
      …
      <div ref={slotRef} className={s.slot} />…
    </div>
  );
};
```

`useTelegramLogin` owns the whole effect — it injects Telegram's widget script into
`slotRef`, registers the global callback and removes both on unmount — and composes
`useTelegramWidget` and `useWidgetSignIn`, each in its own folder in
`features/auth/telegram-sign-in/model/hooks/`. This keeps effects from bloating the body
of the component; each one is isolated and can be reasoned about on its own. The
alternative — a pile of `useEffect` inside the component — is forbidden (it blows past
the 100-line limit, section 4).

### Examples

**`TelegramCode.types.ts`:**

```ts
export type TelegramCodeProps = {
  bot: string;
  code: string;
};
```

**`TelegramCode.module.scss`** — the component's styles; classes are read off `s`:

```scss
.root {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 22px;
  gap: 10px;
}
```

**`TelegramCode.tsx`** (abridged):

```tsx
import { useTranslations } from 'next-intl';

import { Text } from '@/ui-kit';

import type { TelegramCodeProps } from './TelegramCode.types';

import { botLink } from '../../../lib';

import s from './TelegramCode.module.scss';

export const TelegramCode = ({ bot, code }: TelegramCodeProps) => {
  const t = useTranslations('telegram');

  return (
    <div className={s.root}>
      <a className={s.openBot} href={botLink({ bot, code })} rel='noopener noreferrer' target='_blank'>
        {t('openBot')}
      </a>

      <Text className={s.waiting} size='xs' tone='muted'>
        {t('waiting')}
      </Text>
    </div>
  );
};
```
