# The `model/`, `lib/` and `api/` segments

Part of the [style guide](../README.md).

## 11. The `model/`, `lib/` and `api/` segments

**`model/`** — hooks, context providers, state types.

```
features/billing/checkout/model/
  hooks/                     ← a group of hooks
    index.ts                 ← the hooks barrel
    use-checkout/
    use-bind-card/
    use-settle-payment/
  context/                   ← a subsystem is a folder (provider + context + hook)
    index.ts
  types.ts                   ← the slice's public types, when other slices use them
  (no model/index.ts — the barrel sits on the subfolders)
```

No slice ships a `context/` or a `types.ts` today; the tree shows where they go
when one does.

Files are kebab-case. The functions inside them are camelCase.

**A subsystem is a folder.** A provider plus its context and hook (or a hook plus
two or more modules that exist only for it) gets its own folder with an
`index.ts` — `model/context/`, for instance. A slice's hooks and contexts are
grouped into `model/hooks/` and `model/context/` (see the barrel rule below). A
completely flat `model/` — one or two files, no subfolders — is fine for a small
slice.

**Grouping inside `model/`.** When a slice accumulates many `model` files, group
them into subfolders by nature (`model/context/`, `model/hooks/`) — see
`features/vpn/connect-incy` and `features/billing/checkout`, both of which group
their hooks under `model/hooks/`. That is organisation
**inside** the `model/` segment, not a separate top-level `hooks/` segment (which
is forbidden — see below).

**The `model/` barrel rule.** Every `model/` subfolder gets its own `index.ts`
(`model/hooks/index.ts`, `model/context/index.ts`). **Do not create a slice-level
`model/index.ts`.** Importing from outside a subfolder goes through its barrel:

```ts
// ✓ OK — ui/components/AutoRenewControl/AutoRenewControl.tsx
import { useBindCard, useUnbindCard } from '../../../model/hooks';
// the slice index.ts
export { useBindCard } from './model/hooks';

// ✗ NOT OK
import { useBindCard } from '../../../model/hooks/use-bind-card'; // deep, past the barrel
import { useBindCard } from '../../../model'; // model/index does not exist
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
shared/seo/json-ld/
  breadcrumb-json-ld/  ← the trail a page reports to a crawler
  faq-json-ld/         ← the questions a FAQ page reports
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

No slice has an `api/` segment today: every request the client makes is a plain
HTTP call, and those all live in `shared/api/`.

The heuristic: code that **listens to or sends to** an external service is
`api/`; code that **reads or derives** domain state is `model/`. A
project-agnostic RPC client, tied to no domain, goes in `shared/api/` (below).

**`api/` in `shared/`** — axios wrappers, one folder per domain:

```text
shared/api/
  http/               ← the axios instance: baseURL, bearer token, ApiError
  auth/               ← the better-auth client, session start/reset
  account/            ← deleteAccount
  billing/            ← checkout, auto-renew, bound cards, extra devices
  devices/            ← the device registry: list and remove
  subscription/       ← status and trial
  subscription-link/  ← the INCY link and its rotation
  telegram/           ← linking and Telegram sign-in
  query-client.ts
  index.ts
```

HTTP goes through the shared axios instance from `shared/api/http`. A hand-rolled
`fetch` is unnecessary: the instance already attaches `Authorization` and turns
the server's `{ error, code }` body into an `ApiError`.

```ts
import type { SubscriptionLink } from '@gnomevpn/schemas';

import { api } from '../http';

export const getSubscriptionLink = async (): Promise<SubscriptionLink> => {
  const { data } = await api.get('/subscription-link');

  return data;
};
```

Request and response types come from `@gnomevpn/schemas` — the same contract
NestJS validates against. The function returns `data`; errors are thrown, and
React Query catches them.
