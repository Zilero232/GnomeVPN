# `model/hooks` structure

Part of the [style guide](../README.md).

### 2.2. `model/hooks` structure

Symmetrical to `ui/`: **a hook with types of its own gets its own folder**, a flat file only when there are no types.

```
features/account/link-telegram/model/hooks/
  index.ts                            ← segment barrel
  use-issue-code/
    use-issue-code.ts
    index.ts
  use-unlink-telegram/
    use-unlink-telegram.ts
    index.ts
  use-telegram-status/
    use-telegram-status.ts
    use-telegram-status.types.ts      ← there is an Input type → the folder is mandatory
    use-telegram-status.constants.ts
    index.ts
```

A hook with no types of its own does not strictly need a folder (`use-issue-code/`
holds only `use-issue-code.ts` + `index.ts`), but consistency within a slice matters
more: keep everything in folders.

A hook's `index.ts` re-exports both the hook and its types:

```ts
export { useTelegramStatus } from './use-telegram-status';

export type { UseTelegramStatusInput } from './use-telegram-status.types';
```

A hook's input type is named `Use<Name>Input` (§5) — `UseTelegramStatusInput`. When it
merely repeats a component's props, don't duplicate it; derive it instead:
`Pick<AutoRenewControlProps, 'subscription'>`.
