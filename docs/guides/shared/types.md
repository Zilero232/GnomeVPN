# Types

Part of the [style guide](../README.md).

## 8. Types

- **Everything through `type`** — Props, unions, aliases, DTOs. `interface` is forbidden:
  ESLint `ts/consistent-type-definitions: ['error', 'type']`.
- Props always live in `<Name>.types.ts` next to the component.
- `import type { ... }` — enforced by ESLint (`ts/consistent-type-imports`), `bun lint:fix` fixes it.
- `export type { ... }` — enforced the same way.
- `unknown` instead of `any`. `any` is forbidden.
- Unions for state variants — a string-literal union when the variants carry no data,
  a discriminated union of objects (`{ kind: …; … }`) when they do, so `match(...).exhaustive()`
  can check every case:

```ts
// views/auth/ui/AuthPage.types.ts
export type AuthMode = 'forgot' | 'signin' | 'signup';
```

### 8.1 Field order in Props and destructuring

One order in **`type Props`** and **the parameter destructuring**, and the same groups at **the JSX call site** (where ESLint sorts within them). That way the eye looks for the same thing the same way.

The order:

1. **Data** — strings, numbers, booleans, objects, refs, `children`.
2. **Identifiers / styles** — `id`, `className`, `style`.
3. **Event handlers** — `onClick`, `onSubmit`, `onChange`, any `on<Event>`.

```ts
// ✓ OK — features/account/link-telegram/ui/components/TelegramLinked
export type TelegramLinkedProps = {
  bot: string;
  username: string | null;
  hasEmail: boolean;
  isPending: boolean;
  onUnlink: () => void;
};

export const TelegramLinked = ({ bot, username, hasEmail, isPending, onUnlink }: TelegramLinkedProps) => {
  ...
};

// JSX (TelegramPanel):
<TelegramLinked
  bot={status.botUsername}
  hasEmail={hasEmail}
  isPending={unlink.isPending}
  username={status.username}
  onUnlink={() => setIsUnlinkOpen(true)}
/>
```

The logic: "what we show" → "how it looks" → "what it does". Meaning first, then form, then behaviour.

Within each group the order is free, but **Props and destructuring must match** — a mismatch is caught at review. At the JSX call site ESLint owns the order: `perfectionist/sort-jsx-props` sorts props alphabetically, with shorthand props first and `on<Event>` callbacks last, so the data → handlers shape holds there too and `bun lint:fix` applies it.
