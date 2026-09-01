# GnomeVPN Style Guide

Project code-style conventions for `apps/client/`. Architectural rules live in [`docs/fsd.md`](./fsd.md).

Tools:

- **ESLint** (`bun lint` / `bun lint:fix`) — linter + import sorting (`perfectionist/sort-imports`) + `padding-line-between-statements`. Config: the root `eslint.config.mjs`.
- **Prettier** (`bun format` / `bun format:check`) — formatter. Config: `prettier.config.mjs`.
- **Stylelint** (`bun lint:css`) — SCSS modules.
- **TypeScript** strict + `noUnusedLocals` + `noUnusedParameters`.
- FSD boundaries and a handful of React conventions are kept by hand and caught at review (the linter does not cover hook order or FSD cross-slice imports).

**Why ESLint + Prettier:** the `@siberiacancode/*` configs already carry a rule set for
React/TS/SCSS, and `perfectionist` plus `padding-line-between-statements` autofix exactly
the two things that would otherwise have to be kept by hand. It all runs under one
command — `bun run verify` (typecheck + ESLint + Prettier + Stylelint + `cargo fmt`
+ `cargo clippy`).

---

## 1. Slice structure

Every slice is a folder of segments. The minimum is `ui/` + `index.ts`:

```
features/vpn/connect/
  index.ts          ← public API (barrel)
  ui/               ← React components
  model/            ← hooks, contexts, state types
  lib/              ← pure slice utilities
  api/              ← the I/O boundary: subscriptions, mappers, service wrappers (when there are any)
  config/           ← constants, configuration
```

Slices are grouped by business domain (`app`, `auth`, `billing`, `vpn`) — a layer on top
of canonical FSD, see [`docs/fsd.md`](./fsd.md) §3. Always import down to the slice level:
`@/features/vpn/connect`, not `@/features/vpn`.

---

## 2. Slice `ui/` structure

**The main component** lives flat in `ui/`, with its files next to it:

```
features/vpn/connect/ui/
  ConnectButton.tsx          ← JSX + entry component
  ConnectButton.types.ts     ← Props and local union types
  ConnectButton.module.scss  ← component styles
  ConnectButton.motion.ts    ← motion presets (when the component is animated)
```

**Subcomponents** (used only inside the parent) — each one in a `components/` folder:

```
features/vpn/split-tunneling/ui/SplitTunnelingDialog/
  SplitTunnelingDialog.tsx
  SplitTunnelingDialog.types.ts
  SplitTunnelingDialog.module.scss
  components/
    index.ts                   ← barrel: re-exports every subcomponent
    SplitModeToggle/
      SplitModeToggle.tsx
      SplitModeToggle.types.ts
      SplitModeToggle.module.scss
      index.ts                 ← `export { SplitModeToggle } from './SplitModeToggle';`
    AppSection/
      ...
    AddressSection/
      ...
```

The parent imports through the barrel:

```ts
// ✓ OK
import { AddressSection, AppSection, SplitModeToggle } from './components';

// ✗ NOT OK
import { SplitModeToggle } from './components/SplitModeToggle';
```

**File rules:**

- `.types.ts` — created only when there are Props or local union types.
- `.module.scss` — component styles (imported as `import s from './Foo.module.scss'`). Required everywhere: in `shared/ui` as much as in widgets/features/views. There is no CSS-in-JS in this project.
- `.motion.ts` — animation presets for `motion`, next to the component (`ConnectButton.motion.ts`, `ProtocolSwitch.motion.ts`). Don't duplicate an animation with a CSS transition.
- `shared/ui/` — the atomic layer (atoms/molecules/organisms). **No flat `button.tsx`** — every primitive lives in a PascalCase folder (§2.1). From outside — `@/shared/ui`.

### 2.1. `shared/ui` structure

Every primitive gets its own folder. Flat kebab-case files in `atoms/` are legacy; don't add new ones.

```
shared/ui/
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
    Select/
      Select.tsx
      Select.module.scss
      Select.types.ts
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
- Headless + a11y — **`@base-ui/react`**; imported from the package subpath: `@base-ui/react/dialog`, `@base-ui/react/select`, `@base-ui/react/field`, `@base-ui/react/tabs`. Rename the base primitive at the import (`Select as BaseSelect`) so our own export can carry the plain name.
- React types are **named imports** (`ComponentProps`, `ReactNode`, …), not `import type * as React`.
- Inside `shared/ui`, imports between layers are relative (`../../atoms/Button`). From outside — only `@/shared/ui`.
- The barrels at all three levels (`atoms/index.ts`, `molecules/index.ts`, `organisms/index.ts` and the root `shared/ui/index.ts`) use **explicit named** re-exports, with values and types in separate blocks.

### Slice barrel

```ts
// features/vpn/connect/index.ts
export { useVpnConnectionContext, VpnConnectionProvider } from './model/context';
export { useProtocolSelection } from './model/hooks';
export type { VpnConnectionStatus, VpnTraffic } from './model/hooks';

export { ConnectButton } from './ui/ConnectButton';
export type { ConnectButtonProps } from './ui/ConnectButton.types';
```

### Effect hooks instead of a pile of `useEffect` in the component

A side effect with no markup is **its own hook in `model/hooks/`** — it returns nothing
and encapsulates a single effect (autoconnect, the tunnel event subscription, traffic
polling, the watchdog, notifications). The orchestrator is the Provider that calls them:

```tsx
// features/vpn/connect/model/context/VpnConnectionProvider.tsx
export const VpnConnectionProvider = ({ children }: { children: ReactNode }) => {
  const { isNativeApp } = usePlatform();

  const connection = useVpnConnection();
  const { nodes, isLoading, isError } = useNodes();
  const { hasAccess } = useSubscriptionStatus();

  useAutoConnect({
    nodes,
    hasAccess,
    isConnected: connection.status !== 'disconnected',
    isReady: isNativeApp && !isLoading && !isError,
    connect: connection.connect
  });

  return <VpnConnectionContext.Provider value={connection}>{children}</VpnConnectionContext.Provider>;
};
```

This keeps effects from bloating the body of the main component; each one is isolated
and can be reasoned about on its own. The alternative — a pile of `useEffect` inside
`ConnectButton.tsx` — is forbidden (it blows past the 100-line limit, section 4).

`useAutoConnect`, `useTunnelEvents`, `useTrafficPoll`, `useConnectWatchdog` and
`useTunnelNotifications` each get their own folder in `features/vpn/connect/model/hooks/`.

### Examples

**`ConnectButton.types.ts`:**

```ts
import type { VpnConnectionStatus } from '../model/hooks/use-vpn-connection';

export type ConnectButtonProps = {
  status: VpnConnectionStatus;
  disabled?: boolean;
  onToggle: () => void;
};
```

**`ConnectButton.module.scss`** — the component's styles; classes are read off `s`:

```scss
@use '@/shared/styles/mixins' as *;

.root {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}
```

**`ConnectButton.tsx`:**

```tsx
'use client';

import type { ConnectButtonProps } from './ConnectButton.types';

import s from './ConnectButton.module.scss';

export const ConnectButton = ({ status, disabled, onToggle }: ConnectButtonProps) => (
  <button className={s.root} disabled={disabled} type='button' onClick={onToggle}>
    {status}
  </button>
);
```

---

### 2.2. `model/hooks` structure

Symmetrical to `ui/`: **a hook with types of its own gets its own folder**, a flat file only when there are no types.

```
features/vpn/split-tunneling/model/hooks/
  index.ts                        ← segment barrel
  use-split-tunneling/
    use-split-tunneling.ts
    use-split-tunneling.types.ts
    index.ts
  use-app-source/
    use-app-source.ts
    use-app-source.types.ts       ← there is an Input/Output type → the folder is mandatory
    index.ts
```

A hook with no types of its own does not strictly need a folder (`use-protocol-selection/`
holds only `use-protocol-selection.ts` + `index.ts`), but consistency within a slice matters
more: keep everything in folders.

A hook's `index.ts` re-exports both the hook and its types:

```ts
export { useAutoConnect } from './use-auto-connect';

export type { UseAutoConnectParams } from './use-auto-connect.types';
```

A hook's input type is named `Use<Name>Input` (§5) — `UseAppSourceInput`. When it merely
repeats a component's props, don't duplicate it; derive it instead:
`Pick<ConnectButtonProps, 'status' | 'onToggle'>`.

---

## 3. Styles: SCSS modules only

| Layer | Format |
|---|---|
| `shared/ui/**` | `*.module.scss` + CSS variables from `app/globals.scss` |
| widgets / features / views | `*.module.scss` |

There is no CSS-in-JS in this project — no Tailwind, no `.styles.ts`, no `cva`.

| Case | Where |
|---|---|
| Component styles in `shared/ui` | `<Name>.module.scss` |
| Styles for a slice subcomponent | `<Name>.module.scss` next to it |
| Conditional classes | `clsx(s.root, isBlocked && s.blocked)` or SCSS modifiers |
| Primitive variants/sizes | a map in `<Name>.variants.ts` (`Button.variants.ts`) |
| Animation | `motion` + presets in `<Name>.motion.ts` |
| Media query | `@include below(md)` / `@include from(2xl)` from `shared/styles/mixins` — never raw pixels |

Joining module classes with an optional `className` prop is done with **`clsx`** (`import { clsx } from 'clsx'`).

The principle: the JSX reads, and `s.root`/`s.panel` tell you the structure.

---

## 4. Component size

**100 lines per JSX file, maximum.**

Over the line means refactor:

1. Subcomponents → `components/`.
2. Logic → `model/` (a hook).
3. Utilities → the slice's `lib/`.

**A multi-export primitive** (`Dialog` ships `Dialog`, `DialogContent`,
`DialogHeader`, `DialogTitle`, `DialogDescription`) stays in one file **as long as it
fits the limit** — `shared/ui/molecules/Dialog/Dialog.tsx` is thin wrappers over
`@base-ui/react/dialog`, all five of them in 35 lines. The moment it goes over, the parts
move out into `components/<Name>/` and `<Name>.tsx` stays as a thin re-export.
Group by meaning, not one file per export: closely related parts
(`Header`/`Title`/`Description`) live together.

Subcomponent nesting may go to a second level when a subcomponent has grown of its own
accord: `views/app-view/ui/components/AppMenu/components/MenuItem/`. No deeper than that —
it is a signal that the block should be lifted into a slice of its own.

**Context shared between the parts goes in its own module** next to `<Name>.tsx`, not
inside the component: otherwise `components/*` import the parent and the parent imports
them. That is how `features/vpn/connect` is built — the context in
`model/context/vpn-connection-context.ts`, the provider in a separate file alongside it.

---

## 5. Naming

| What | How | Example |
|---|---|---|
| Slices | kebab-case | `split-tunneling`, `check-update` |
| Segments | kebab-case | `ui`, `model`, `lib`, `api`, `config` |
| Component folder | PascalCase | `SplitTunnelingDialog/`, `NodePicker/` |
| Component file | PascalCase + `.tsx` | `SplitTunnelingDialog.tsx` |
| Types file | `<Name>.types.ts` | `SplitTunnelingDialog.types.ts` |
| Styles file | `<Name>.module.scss` | `Button.module.scss` |
| Hook file | kebab-case | `use-split-tunneling.ts` |
| React component (export) | PascalCase | `SplitTunnelingDialog` |
| Hook | `use` + camelCase | `useAutoConnect`, `useSplitTunneling` |
| Utility | camelCase | `matchesQuery`, `openExternal` |
| Props type | `<Name>Props` | `ConnectButtonProps` |
| DTO type | `<Name>Input/Output` | `UseAppSourceInput` |

> Canonical FSD: kebab-case for every file. GnomeVPN deviates: PascalCase for component folders and files, kebab-case for hooks and utilities.

---

## 6. Imports

### Aliases

`@/` → the `apps/client/` root. Used for everything except relatives inside the same folder.

### Group order

`perfectionist/sort-imports` (`bun lint:fix`) sorts imports into groups in this order, **with a blank line between groups**:

1. **External value imports** — packages, `node:` builtins, `@gnomevpn/*`.
2. **Internal value imports** — `@/` aliases.
3. **Types** — every `import type`, external and local together.
4. **Relative value imports** — `./` and `../`.
5. **Styles** — `*.css` / `*.scss`.

```ts
// 1. external values
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

// 2. internal values
import { logger } from '@/shared/lib';
import { Badge, Button } from '@/shared/ui';

// 3. types (external + local)
import type { Node } from '@gnomevpn/schemas';
import type { SplitTunnelingDialogProps } from './SplitTunnelingDialog.types';

// 4. relative values
import { AddressSection, AppSection } from './components';

// 5. styles
import s from './SplitTunnelingDialog.module.scss';
```

The configuration lives in the root `eslint.config.mjs` (via the `@siberiacancode/eslint` preset).
ESLint inserts the blank lines between groups on `bun lint:fix`; don't strip them by hand.

### Prohibitions

A deep import past a barrel is forbidden:

```ts
// ✗ FORBIDDEN
import { SplitModeToggle } from '@/features/vpn/split-tunneling/ui/SplitTunnelingDialog/components/SplitModeToggle';
import { Button } from '@/shared/ui/atoms/Button';

// ✓ OK
import { SplitTunnelingButton } from '@/features/vpn/split-tunneling';
import { Button } from '@/shared/ui';
```

`shared/ui` has a single root barrel, `@/shared/ui` (the atomic layer sits under it). Inside a slice, relative imports are fine.

ESLint does not check FSD boundaries — those are caught at review.

---

## 7. Barrel exports (`index.ts`)

**A slice:**

```ts
// features/vpn/download-config/index.ts
export { useConfigs, useIssueConfig, useRevokeConfig } from './model/hooks';
export { ConfigList } from './ui/ConfigList';

export type { ConfigListProps } from './ui/ConfigList.types';
```

Only what is needed from outside. Internal subcomponents are not exported.

**A component folder:**

```ts
// ui/SplitTunnelingDialog/index.ts
export { SplitTunnelingDialog } from './SplitTunnelingDialog';
```

**A subsystem in `model/`:** when a hook is assembled from several files in a subfolder, the `index.ts` next to them exports only the public entry point — the Provider and the hook. Internal modules and types do not go out.

```ts
// features/vpn/connect/model/context/index.ts
export { VpnConnectionProvider } from './VpnConnectionProvider';
export { useVpnConnectionContext } from './vpn-connection-context';
```

Wildcard exports (`export * from`) are forbidden. Explicit named exports only.

---

## 8. Types

- **Everything through `type`** — Props, unions, aliases, DTOs. `interface` is forbidden:
  ESLint `ts/consistent-type-definitions: ['error', 'type']`.
- Props always live in `<Name>.types.ts` next to the component.
- `import type { ... }` — enforced by ESLint (`ts/consistent-type-imports`), `bun lint:fix` fixes it.
- `export type { ... }` — enforced the same way.
- `unknown` instead of `any`. `any` is forbidden.
- Discriminated unions for state variants:

```ts
export type TunnelEvent =
  | { type: 'bytesUpdate'; rx: number; tx: number }
  | { type: 'connected'; assignedIp: string }
  | { type: 'connecting' }
  | { type: 'disconnected' }
  | { type: 'error'; message: string }
  | { type: 'handshake' };
```

### 8.1 Field order in Props and destructuring

One order in all three places: **`type Props`**, **the parameter destructuring**, and **the JSX call site**. That way the eye looks for the same thing the same way.

The order:

1. **Data** — strings, numbers, booleans, objects, refs, `children`.
2. **Identifiers / styles** — `id`, `className`, `style`.
3. **Event handlers** — `onClick`, `onSubmit`, `onChange`, any `on<Event>`.

```ts
// ✓ OK
export type NodePickerProps = {
  nodes: Node[];
  activeNodeId: string | null;
  isLoading: boolean;
  isError: boolean;
  isLocked: boolean;
  latency?: LatencyByNode;
  onSelect: (nodeId: string) => void;
};

export const NodePicker = ({
  nodes,
  activeNodeId,
  isLoading,
  isError,
  isLocked,
  latency = {},
  onSelect,
}: NodePickerProps) => {
  ...
};

// JSX:
<NodePicker
  activeNodeId={selection.nodeId}
  isError={isError}
  isLoading={isLoading}
  isLocked={status !== 'disconnected'}
  latency={latency}
  nodes={nodes}
  onSelect={selection.select}
/>
```

The logic: "what we show" → "how it looks" → "what it does". Meaning first, then form, then behaviour.

Within each group the order is free, but **it must match in all three places** (Props ↔ destructuring ↔ JSX). A mismatch is caught at review.

---

## 9. Arrow functions: the body

**Every declaration (top-level and module-level) uses a block body with `return`.** Single-line expression bodies are forbidden: `=> { return ... }` looks the same regardless of the body's size, so nothing has to be rewritten when the logic grows.

```ts
// ✓ OK
const resolveDeviceId = async (): Promise<string> => {
  const stored = await deviceIdSetting.get();

  if (stored) {
    return stored;
  }

  const created = isServer() ? crypto.randomUUID() : fromBrowserStorage();

  await deviceIdSetting.set(created);

  return created;
};

// ✗ NOT OK
const clientKind = (): CheckoutClient => (isTauriDesktop() ? 'desktop' : 'web');
```

**Exceptions — keep the expression body:**

- **React components that return JSX directly** — the JSX is itself the "body", and a `{ return }` wrapper visually duplicates it:

  ```tsx
  // ✓ OK
  export const ConnectButton = ({ status, disabled, onToggle }: ConnectButtonProps) => (
    <button className={s.root} disabled={disabled} type='button' onClick={onToggle}>
      {status}
    </button>
  );
  ```

- **Inline callbacks** (function arguments, JSX props, hook methods):

  ```ts
  // ✓ OK — this is an argument, not a declaration
  nodes.map((node) => node.id);
  nodes.filter((node) => node.isActive);
  pipe(xs, filter((x) => x > 0));
  useEffect(() => setOpen(true), []);
  <Button onClick={() => router.push('/app')} />
  match(state).with('idle', () => null)
  ```

- **Primitives in `shared/ui/`** — their own convention (PascalCase folders, SCSS modules, Base UI). See §2.1.

**The review rule:** if the arrow is to the right of an `=` (a function declaration), block body. If the arrow sits inside `(...)` or `{...}` (an argument), it's your call — usually an expression.

### 9.5 `if` / `else` — always with braces

**The body of `if`, `else if` and `else` always goes in `{}`, even for a single line.** A one-liner `if (cond) doThing();` is forbidden: adding a second statement to the branch then needs no structural rewrite, diffs stay cleaner, and there is no "forgot the braces" trap. Enforced by ESLint (`curly`) — `bun lint:fix` fixes it automatically.

```ts
// ✓ OK
if (!isTauri()) {
  return;
}

if (isManual) {
  toast.success(t('upToDate'));
}

// ✗ NOT OK
if (!isTauri()) return;
if (isManual) toast.success(t('upToDate'));
```

A ternary that returns a value is still fine (it is an expression, not a statement): `return a ? b : c;`.

---

## 10. React conventions

- Function components, arrow functions.
- `'use client'` in every file with hooks, state or event handlers.
- The React Compiler is on — `useMemo`/`useCallback` are not needed for micro-optimisations. Keep them only for a semantically stable ref (`useEffect` dependencies, a key in a Map).
- Event handlers are `on<Event>` in camelCase: `onSubmit`, `onSelect`.
- React types come in as **named imports**: `import type { ComponentProps, ReactNode } from 'react'`. **`import type * as React from 'react'` is forbidden.**

### 9.1 Hook order

ESLint does not sort hooks — we keep the order by hand and catch it at review.

Group order:

1. **Navigation** — `useRouter`, `usePathname`, `useSearchParams`, `useParams`.
2. **Store / context** — `useCurrentUser`, `usePlatform`, any `use<Name>Context`.
3. **Data** — TanStack Query/Mutation hooks.
4. **State** — `useState`, `useReducer`.
5. **Ref** — `useRef`.
6. **Memo / callbacks** — `useMemo`, `useCallback`, `useTransition`, `useId`.
7. **Effects** — `useEffect`, `useLayoutEffect`.
8. **Derived consts** — `const x = params.get(...)`, values unpacked out of hooks.

A blank line between groups. No blank line inside a group.

```tsx
export const ConfigList = ({ className }: ConfigListProps) => {
  const router = useRouter();

  const { hasAccess, limits } = useSubscriptionStatus();

  const { nodes, isLoading: isLoadingNodes } = useNodes();
  const { configs, isLoading: isLoadingConfigs } = useConfigs();
  const revoke = useRevokeConfig();

  const [filter, setFilter] = useState(CONFIG_FILTER_ALL);

  useEffect(() => {
    // ...
  }, [configs]);

  const isFull = configs.length >= limits.configLimit;

  return /* ... */;
};
```

**Rules for reordering:**

- Never move a hook that has a data dependency: if `nodeId` is needed by `useNodeLatency({ nodeId })`, then `nodeId` has to come before the hook. When the group order conflicts with that, leave it as is and mark it `// data dep: nodeId → query`.
- `if (...) useFoo()` is a `rules-of-hooks` bug — fix it, don't sort it.

**Custom hooks** are placed by what they contain: `useNodes` (which runs `useQuery`) → the Data group; `useCurrentUser` (a context wrapper) → the Store group; `useDocumentTitle` (an effect) → the Effects group.

### 9.2 Hook / effect dependencies

A `useEffect` `deps` array holds only what **should genuinely retrigger** the effect. If we know the effect needs one `nodeId`, we don't add `node`, `router` or mutation objects "to keep the linter quiet".

**Stable refs do not go in deps.** `router` from `next/navigation`, and `reset`/`mutate` from react-query, are stable between renders. There is no point adding them — the effect must not react to their "change". An `// eslint-disable-next-line react-hooks/exhaustive-deps` with an explicit reason is normal practice, not a crutch.

```tsx
// ✗ BAD — surplus deps, and the mutation object changes ref on every render
useEffect(() => {
  if (!nodeId) router.replace(ROUTES.account);
}, [nodeId, node, router, connectMutation]);

// ✓ OK — the only trigger is nodeId, and the reason is recorded
// eslint-disable-next-line react-hooks/exhaustive-deps -- redirect must fire only on nodeId change; router is a stable ref
useEffect(() => {
  if (!nodeId) router.replace(ROUTES.account);
}, [nodeId]);
```

**Anti-pattern: `useEffect` + `mutate` to load data.** A mutation object in deps means a new ref every render, which means refetch loops. Declarative loading goes through `useQuery` with a key (`queryKey: [nodeId]`) — react-query refetches on a key change by itself, and neither `useEffect` nor `reset()` is needed.

### 9.3 Destructuring query / mutation results

The result of `useQuery` or a custom query hook is **destructured on the spot** — don't carry the object around and don't reach through the dot:

```tsx
// ✗ BAD — dot access, and the wrapper object earns nothing
const configsQuery = useConfigs();
const configs = configsQuery.configs;
// ... configsQuery.isLoading, configsQuery.isError

// ✓ OK — destructured in place, renamed for meaning
const { data: nodes, isLoading } = useQuery({ queryKey: QUERY_KEYS.nodes(), queryFn: listNodes });
const { configs, isLoading: isLoadingConfigs } = useConfigs();
```

`data` is almost always renamed (`data: nodes`) — a bare `data` carries no meaning.

**The exception is `useMutation`.** A mutation object is kept whole: both its fields (`isPending`, `isError`, `error`, `data`) and its methods (`mutateAsync`, `reset`) are needed. Destructuring five-plus names reads worse, and the methods get called as `revoke.reset()` anyway.

```tsx
// ✓ OK — the mutation stays an object
const revoke = useRevokeConfig();
// ... revoke.isPending, revoke.mutateAsync(...), revoke.reset()
```

### 9.4 Destructure wherever it simplifies

The principle: **destructure as much as you can** — for readability. If a value is reached through the dot twice or more, or arrives nested, pull it into a local variable. Less `obj.a.b` noise, and the names speak for themselves.

**Nested access — destructure the parent:**

```ts
// ✗ BAD — config.node.X repeats
buildLabel({
  country: config.node.country,
  code: config.node.countryCode,
  server: config.node.server,
  nodeId: config.nodeId,
});

// ✓ OK — node pulled out once
const { node, nodeId } = config;

buildLabel({
  country: node?.country,
  code: node?.countryCode,
  server: node?.server,
  nodeId,
});
```

**Function parameters: 3+ arguments → one destructured object.** Positional arguments (especially same-typed ones — `string, string, string`) are easy to swap by mistake; an object is self-documenting and order stops mattering.

```ts
// ✗ BAD — 4 positional, easy to mix up
buildLabel(country, code, server, nodeId);

// ✓ OK — an object parameter, destructured in the signature
buildLabel({ country, code, server, nodeId });
```

**A repeated `obj.x` (2+) goes into a local variable / destructuring:**

```ts
// ✗ BAD
if (file.size === 0) ...;
if (file.size > MAX) ...;
const ext = extension(file.type);

// ✓ OK
const { size, type, name } = file;

if (size === 0) ...;
if (size > MAX) ...;
const ext = extension(type);
```

**When NOT to destructure:**

- A single access — one `obj.x`, and destructuring is ceremony.
- Context is lost — if a bare `name` leaves it unclear whose it is, keep `user.name` or rename (`const { name: nodeName } = ...`).
- A stable namespace object (`router`, `console`, `Math`) — leave it alone.

---

## 11. The `model/`, `lib/` and `api/` segments

**`model/`** — hooks, context providers, state types.

```
features/vpn/connect/model/
  hooks/                     ← a group of hooks
    index.ts                 ← the hooks barrel
    use-vpn-connection/
    use-tunnel-state/
  context/                   ← a subsystem is a folder
    index.ts                 ← barrel: { VpnConnectionProvider, useVpnConnection }
    VpnConnectionProvider.tsx
    vpn-connection-context.ts
  types.ts                   ← the slice's public types, when other slices use them
  (no model/index.ts — the barrel sits on the subfolders)
```

Files are kebab-case. The functions inside them are camelCase.

**A subsystem is a folder.** A provider plus its context and hook (or a hook plus
two or more modules that exist only for it) gets its own folder with an
`index.ts` — `model/context/`, for instance. A slice's hooks and contexts are
grouped into `model/hooks/` and `model/context/` (see the barrel rule below). A
completely flat `model/` — one or two files, no subfolders — is fine for a small
slice.

**Grouping inside `model/`.** When a slice accumulates many `model` files, group
them into subfolders by nature (`model/context/`, `model/hooks/`) — see
`features/vpn/connect` and `features/vpn/split-tunneling`. That is organisation
**inside** the `model/` segment, not a separate top-level `hooks/` segment (which
is forbidden — see below).

**The `model/` barrel rule.** Every `model/` subfolder gets its own `index.ts`
(`model/hooks/index.ts`, `model/context/index.ts`). **Do not create a slice-level
`model/index.ts`.** Importing from outside a subfolder goes through its barrel:

```ts
// ✓ OK
import { useVpnConnection } from '../model/hooks';
import { VpnConnectionProvider } from '../model/context';
// the slice index.ts
export { useVpnConnection } from './model/hooks';

// ✗ NOT OK
import { useVpnConnection } from '../model/hooks/use-vpn-connection'; // deep, past the barrel
import { useVpnConnection } from '../model';                          // model/index does not exist
```

Between files **inside one subfolder**, import by file (`./use-x`, `../types`),
never through your own barrel — that is a self-import. `model/types.ts` is a
file, not a folder: import it directly as `../model/types`, with no barrel. A
flat `model/` — no subfolders, just `use-x.ts` and `types.ts` — needs no barrel
at all; import by file.

**Types:**

- Types local to one hook (`Props`, its input and output, internal unions) live
  **beside it in the same file**. Do not hoist them.
- The slice's public types — the ones other slices reach through the barrel — go
  in `model/types.ts`.
- A subsystem folder with internal types of its own gets
  `model/<subsystem>/types.ts`.

Do not create a separate `types/` or `hooks/` segment. That splits code by the
shape of the file rather than by its nature, which is an FSD anti-pattern.

**`lib/`** — pure functions with no React dependency:

```
features/vpn/split-tunneling/lib/
  matches-query/       ← the fuzzy app-search matcher
  with-picked-apps/    ← merges manually picked apps into the scanned list
```

A function that returns JSX is a component: move it to `ui/`.

**Choosing between `lib/` and `model/`:** a function that uses React
(`useState`, `useEffect`, a context) belongs in `model/`. A pure one — takes
arguments, returns a value — belongs in `lib/`. Error classes, parsers and
mappers are `lib/`. A set of settings or constants is `config/`.

**A slice's `api/`** is an integration with an external service tied to that
slice's domain: subscriptions, mappers, service-specific wrappers. It differs
from `model/` in being an I/O boundary — network, realtime, a push service —
where `model/` holds hooks and state types.

```
entities/vpn/node/
  model/
    hooks/
```

The heuristic: code that **listens to or sends to** an external service is
`api/`; code that **reads or derives** domain state is `model/`. A
project-agnostic RPC client, tied to no domain, goes in `shared/api/` (below).

**`api/` in `shared/`** — axios wrappers, one folder per domain:

```text
shared/api/
  http/          ← the axios instance: baseURL, bearer token, error normalisation
  nodes/         ← listNodes / listNodeEndpoints
  configs/       ← downloadable tunnel configs
  billing/       ← checkout and payment methods
  auth/          ← the better-auth client
  index.ts
```

HTTP goes through the shared axios instance from `shared/api/http`. A hand-rolled
`fetch` is unnecessary: the instance already attaches `Authorization` and unwraps
the server's `{ error }` into an `Error(message)`.

```ts
import type { Node } from '@gnomevpn/schemas';

import { api } from '../http';

export const listNodes = async (): Promise<Node[]> => {
  const { data } = await api.get('/nodes');

  return data;
};
```

Request and response types come from `@gnomevpn/schemas` — the same contract
NestJS validates against. The function returns `data`; errors are thrown, and
React Query catches them.

---

## 12. Global styles and SCSS

- Theme tokens are CSS variables on `:root` in `app/globals.scss` — colours,
  radii, type scale, spacing, the safe-area insets. There is no `_tokens.scss`
  and no separate token file: `shared/styles/` holds only `_animations.scss`,
  `_breakpoints.scss` and `_mixins.scss`.
- The app is dark-only. There is no theme switch, no `.dark` class and no
  `next-themes` — one palette, defined once on `:root`, with
  `:root[data-desktop-app='true']` and `:root[data-mobile-app='true']` adjusting
  only the title-bar height and the safe-area insets.
- Component styles are `*.module.scss`. Shared mixins come in through
  `@use '@/shared/styles/mixins' as *`, which works because `next.config.ts`
  sets `sassOptions.loadPaths` to the client root and aliases `@` for Turbopack.
- Breakpoints come from the scale in `_breakpoints.scss` — `@include below(md)`,
  `@include from(2xl)` — never a hand-written `@media (width <= 620px)`. See
  "Breakpoints come from the scale" in [apps/client/CLAUDE.md](../apps/client/CLAUDE.md).
- `clsx` joins a module class with an incoming `className` prop.

**Property order is enforced.** Stylelint runs
`stylelint-config-idiomatic-order`, so a declaration out of order is an error,
not a warning — `bun run lint:css:fix` sorts it.

---

## 13. Blank lines between logical steps

`padding-line-between-statements` is configured in the root `eslint.config.mjs`
and `bun run lint:fix` applies it. Prettier only preserves blank lines and never
inserts them, which is why the ESLint rule exists at all.

**A blank line before:**

- `return`, when it is not the first statement
- `throw`
- `if` — an early-return guard or a branch
- an `await` that starts a logically separate step
- `try` / `for` / `while` / `switch`

**After an `if` block**, a blank line before the next statement.

```ts
// ✓
const path = await pickExecutable();

if (!path) {
  return;
}

const stored = await splitSetting.get();

toggleApp(path);
setDraft(stored);
```

```ts
// ✓ several returns
if (!node) return null;

if (query.isLoading) {
  return <Spinner />;
}

return <NodePicker />;
```

**Exceptions** — no blank line needed:

- A single statement in a block.
- Consecutive one-line guards of the same shape:
  ```ts
  if (!a) return null;
  if (!b) return null;
  if (!c) return null;
  ```
- Consecutive `const` declarations belonging to one setup block.

---

## 14. Shared schemas — `@gnomevpn/schemas`

Zod schemas and the types shared between client and server live in
`packages/schemas`:

```
packages/schemas/src/
  auth/
    inputs.ts    ← signInSchema, signUpSchema, changeEmailSchema
    types.ts     ← SignInValues, SignUpValues, ChangeEmailValues
    index.ts
  tunnel/
    inputs.ts    ← issueConfigSchema
    outputs.ts   ← tunnelConfigSchema
    types.ts
    index.ts
  billing/, nodes/, subscription/, errors/, release/
```

The package exposes a single root entry point — import from `@gnomevpn/schemas`,
not from a subpath:

```ts
// ✓ OK
import type { ChangeEmailValues } from '@gnomevpn/schemas';

import { changeEmailSchema } from '@gnomevpn/schemas';

// ✗ NOT OK
import { Node } from '@/shared/api';
```

`@/shared/api` exports runtime functions only — the RPC wrappers and the
better-auth client.

**Form values vs request types.** One Zod schema can yield two types: `.default()`
and `.transform()` make `z.input` and `z.output` incompatible. Where that
happens, name them apart:

- `z.input<typeof schema>` is the shape **before** validation — what
  `defaultValues` holds.
- `z.output<typeof schema>` is the shape **after** it, with defaults applied and
  transforms run — what submit and the API body see.

That axis is the validation stage, not HTTP request versus response. An entity's
response type is its own (`Node`), never the `z.output` of an input schema.

Most auth schemas have neither a default nor a transform, so a single
`z.infer` type — `ChangeEmailValues` — serves both ends.

---

## 15. Forms — react-hook-form + zodResolver

```tsx
import type { ChangeEmailValues } from '@gnomevpn/schemas';

import { changeEmailSchema } from '@gnomevpn/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

const DEFAULT_VALUES: ChangeEmailValues = { newEmail: '' };

const {
  formState: { errors, isDirty },
  handleSubmit,
  register,
  reset
} = useForm<ChangeEmailValues>({
  resolver: zodResolver(changeEmailSchema),
  defaultValues: DEFAULT_VALUES
});
```

- The schema comes from `@gnomevpn/schemas`, never inline in the form.
- `DEFAULT_VALUES` is a module-level constant, not an object literal rebuilt on
  every render.
- Server-side errors go through `setError('field', { message })`.
- Validation messages are i18n keys (`validation.emailInvalid`), resolved by
  `useFieldError` from `@/entities/app/locale` — the schema never carries
  user-visible prose.
- A boolean toggle outside a form uses `useBoolean` from
  `@siberiacancode/reactuse` rather than `useState` — except when the setter is
  passed into an effect or a ref, where its identity changes every render.

---

## 16. Conditional render — ts-pattern

Three or more render branches call for `match`, not nested
`if (...) return <X />` and not a chain of ternaries inside JSX.

There are two things worth matching on, and both are fine:

**A. A discriminated union from a hook.** The hook assembles a `state` union and
the view only matches on it. Reach for this when the assembly is substantial or
reused:

```tsx
import { match } from 'ts-pattern';

return match(state)
  .with({ kind: 'connecting' }, () => <ConnectingFallback />)
  .with({ kind: 'connected' }, ({ nodeId }) => <ConnectedPanel nodeId={nodeId} />)
  .exhaustive();
```

`.exhaustive()` turns a forgotten case into a TypeScript error the moment a
variant is added to the union.

**B. An object of raw hook results.** `match` runs straight on
`{ ...hook fields }`, with patterns like `P.nullish` and `P.string`. Reach for
this when there are only a few branches and a separate hook layer would be
ceremony:

```tsx
import { match } from 'ts-pattern';

return match({ isRecurringAvailable, hasPaymentMethod, cancelAtPeriodEnd })
  .with({ isRecurringAvailable: false }, () => null)
  .with({ hasPaymentMethod: false }, () => <BindCardPrompt />)
  .with({ cancelAtPeriodEnd: true }, () => <ResumeAutoRenew />)
  .otherwise(() => <CancelAutoRenew />);
```

The order of `.with` matters — the first matching pattern wins. Take narrowed
values from the handler's argument, which `match` has already narrowed, never
from the closure and never through an `as` cast: a cast sidesteps the check that
makes this worth doing.

**Forbidden either way** — `if` and ternary chains that assemble JSX:

```tsx
// ✗ NOT OK — condition hell in the view
return !nodeId ? null : nodes.isLoading ? <Spinner /> : !node ? <NotFound /> : <NodePanel />;
```

**When to move it into a hook:** the state assembly is reused in two or more
places, or the logic is bulky enough that the view stops reading. Otherwise
option B, inline in the view, is normal.

### 15.1 One branch — use `&&`, not `? : null`

A present-or-absent render — one branch, nothing otherwise — is `cond && <X />`,
not `cond ? <X /> : null`:

```tsx
// ✗ NOT OK — a pointless : null
{isConnected ? <span className={s.badge}>online</span> : null}
{node.isPremium ? <Lock /> : null}

// ✓ OK
{isConnected && <span className={s.badge}>online</span>}
{node.isPremium && <Lock />}
```

Invert `cond ? null : <X />` into `!cond && <X />`.

**The condition must be a boolean.** `&&` renders its left operand as-is, so a
non-boolean falsy value (`0`, `''`, `NaN`) prints as literal garbage — a stray
`0` in the markup. Coerce numeric and string checks first:

```tsx
// ✗ DANGEROUS — renders "0" for an empty list
{apps.length && <List />}

// ✓ OK — an explicit boolean check
{apps.length > 0 && <List />}
{!isEmpty(apps) && <List />}   // isEmpty from remeda
```

---

## 17. Drill cleanup

If the data is reachable through a global hook, the leaf fetches it itself
rather than accepting props:

```tsx
// ✗ BAD — drilling
<ConfigList configLimit={l} deviceName={n} configs={c} onRevoke={d} />

// ✓ OK
const ConfigList = () => {
  const { data: configs } = useConfigs();
  const { configLimit } = useSubscriptionStatus();
  // ...
};
```

**Do not parameterise a component for static content:**

```tsx
// ✗ NOT OK — the text never changes
<Loader text="Loading nodes..." />

// ✓ OK
<NodesLoadingFallback />          // the text lives inside
<NodeConnecting country="NL" />   // only the dynamic part is a prop
```

**Keep props when:**

- The data comes from a `.map` (`<ConfigRow config={config} />`).
- It is the orchestrator's UI state (`isOpen` in `SplitTunnelingDialog`).
- A callback needs the parent's context.

---

## 18. Server routes — NestJS

The API is NestJS on Bun, not a route-definition framework. The full convention
lives in [apps/server/CLAUDE.md](../apps/server/CLAUDE.md); what matters from the
client's side:

```
apps/server/src/modules/nodes/
  nodes.module.ts
  nodes.controller.ts     ← thin: validate, delegate, return
  services/               ← the business logic, one service per domain of work
  dto/                    ← createZodDto(...) wrappers
  lib/                    ← pure functions, one folder per concern
  config/                 ← constants, timeouts, lookup tables
  index.ts                ← the module's public API
```

- DTOs wrap a shared schema: `export class NodeDto extends createZodDto(nodeSchema) {}`.
  The schema itself lives in `@gnomevpn/schemas`, so client and server validate
  against one definition.
- Domain errors are thrown as the app exceptions from `common/exceptions` with a
  code from `@gnomevpn/schemas` — `throw new AppServiceUnavailableException('NODE_UNAVAILABLE')`.
  The client matches on the code, so the message is free text but the code is a
  contract.
- Import from a module's barrel across module boundaries, never into its files.

---

## 19. Forbidden

- `any` — use `unknown`. `ts/consistent-type-assertions` also warns on casts;
  a cast that survives review needs a reason.
- A non-null assertion `!` with no justification.
- Deep imports past a barrel.
- Cross-imports between slices of the same layer.
- CSS-in-JS. SCSS modules only.
- Duplicating a schema between client and server. Only `@gnomevpn/schemas`.
- `useState` for form fields. Only `react-hook-form`.
- Nested `if (...) return <X />` across three or more branches. Use
  `ts-pattern`'s `match`.
- Prop-drilling when the leaf can call the hook itself.
- Comments. The code is expected to read on its own; the reasoning belongs in
  CLAUDE.md or the commit message.
- A user-visible string that does not go through i18n — and it goes into both
  `en.json` and `ru.json`, never one of them.

---

## 20. Checklist before a commit

```bash
bun run fix        # every autofixer: eslint --fix, prettier, stylelint --fix, cargo fmt
bun run verify     # typecheck, eslint, prettier, stylelint, cargo fmt --check, clippy
bun run test       # Vitest across every workspace
bun run test:rust  # cargo test --workspace
```

`bun run test`, never bare `bun test` — Bun's own runner claims that name,
collects the same files and then fails them all, because it is not Vitest.

Tests live in a `_tests/` folder beside what they test
(`shared/lib/vpn-bridge/_tests/vpn-bridge.test.ts`); the Rust ones are
`#[cfg(test)]` modules in the file they cover, and the Playwright specs are in
`e2e/`.

`bun run fix` does not fix: hook order (section 9.1) or FSD import boundaries
(→ [`docs/fsd.md`](./fsd.md)).
