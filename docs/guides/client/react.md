# React conventions

Part of the [style guide](../README.md).

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
2. **Store / context** — `useCurrentUser`, `useHasSession`, any `use<Name>Context`.
3. **Data** — TanStack Query/Mutation hooks.
4. **State** — `useState`, `useReducer`.
5. **Ref** — `useRef`.
6. **Memo / callbacks** — `useMemo`, `useCallback`, `useTransition`, `useId`.
7. **Effects** — `useEffect`, `useLayoutEffect`.
8. **Derived consts** — `const x = params.get(...)`, values unpacked out of hooks.

A blank line between groups. No blank line inside a group.

```tsx
// app/providers/AuthProvider.tsx
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();

  const { isLoading, isAuthenticated } = useCurrentUser();

  const isOpen = isPublicRoute(pathname) || !isKnownRoute(pathname);
  const isGuestOnly = isGuestOnlyRoute(pathname);

  const target = match({ isLoading, isOpen, isGuestOnly, isAuthenticated })
    // ...
    .otherwise(() => null);

  useEffect(() => {
    if (target) {
      router.replace(target);
    }
  }, [target, router]);

  return children;
};
```

The derived consts sit above the effect here because the effect reads `target` —
the data-dependency rule below wins over the group order.

**Rules for reordering:**

- Never move a hook that has a data dependency: if `target` is read by the `useEffect`, then `target` has to come before it. When the group order conflicts with that, leave it as is.
- `if (...) useFoo()` is a `rules-of-hooks` bug — fix it, don't sort it.

**Custom hooks** are placed by what they contain: `useSubscriptionStatus` (which runs `useQuery`) → the Data group; `useCurrentUser` (a session wrapper) → the Store group; `useVerifyEmailOutcome` (an effect) → the Effects group.

### 9.2 Hook / effect dependencies

A `useEffect` `deps` array holds only what **should genuinely retrigger** the effect, plus the stable refs `react-hooks/exhaustive-deps` asks for. `router` from the i18n navigation and `t` from `next-intl` never change between renders, so listing them costs nothing and keeps the linter honest. A suppression is the exception and carries its reason after `--` — `ui-kit/molecules/Segmented` has the one there is, because its effect measures live layout.

What must stay out is an object that changes identity every render, above all a whole mutation result. When an effect needs to call a mutation, keep `mutate` in a ref that is synced on every render and call it through the ref:

```tsx
// ✗ BAD — the mutation object changes ref on every render, so the effect refires
useEffect(() => {
  if (code) signIn.mutate(code);
}, [code, signIn]);

// ✓ OK — features/auth/telegram-sign-in/model/hooks/use-redeem-login
const redeemRef = useRef(signIn.mutate);

redeemRef.current = signIn.mutate;

useEffect(() => {
  // ...
  redeemRef.current(code, { onSuccess: () => router.replace(ROUTES.account) });
}, [code, router]);
```

**Anti-pattern: `useEffect` + `mutate` to load data.** A mutation object in deps means a new ref every render, which means refetch loops. Declarative loading goes through `useQuery` with a key (`queryKey: QUERY_KEYS.<name>(id)`) — react-query refetches on a key change by itself, and neither `useEffect` nor `reset()` is needed.

### 9.3 Destructuring query / mutation results

The result of `useQuery` or a custom query hook is **destructured on the spot** — don't carry the object around and don't reach through the dot:

```tsx
// ✗ BAD — dot access, and the wrapper object earns nothing
const statusQuery = useTelegramStatus();
const status = statusQuery.data;
// ... statusQuery.isPending, statusQuery.isError

// ✓ OK — destructured in place, renamed for meaning
const { data: status, isPending, isError, refetch } = useTelegramStatus();
const { subscription, isLoading } = useSubscriptionStatus();
```

`data` is almost always renamed (`data: nodes`) — a bare `data` carries no meaning.

**The exception is `useMutation`.** A mutation object is kept whole: both its fields (`isPending`, `isError`, `error`, `data`) and its methods (`mutateAsync`, `reset`) are needed. Destructuring five-plus names reads worse, and the methods get called as `unlink.mutate()` anyway.

```tsx
// ✓ OK — the mutation stays an object
const unlink = useUnlinkTelegram();
// ... unlink.isPending, unlink.mutate(undefined, { onSuccess, onError })
```

## Server and browser are both real

Every page is rendered on the server first. A component that touches `window`
during render breaks the prerender, not just a test.

- **Guard browser APIs with `isBrowser()`/`isServer()` from `@/shared/lib`**,
  never a raw `typeof window` check, or read them inside `useEffect`.
- **A provider that wraps every page never swaps `children` for a placeholder.**
  Returning a splash instead ships an empty `<body>` to crawlers on the public
  pages, and on a private one it drops the page segment from rendering
  altogether — which is what Next 16 reports as "could not validate that a
  segment has instant navigation". `AuthProvider` only redirects; the account
  group paints its own shell and lays a splash _over_ the children while the
  session resolves, so the segment always renders.
- **A `useState` initialiser that reads browser state is a hydration mismatch.**
  Read it in an effect instead.
- **Server-only modules stay out of shared barrels.** `shared/lib/server-logger`
  is pino and must never reach the browser bundle; `shared/i18n/navigation` is
  client React and must never reach `sitemap.ts`. Both are separate slices for
  that reason.

## Shared feature state

Once more than two components read a feature's hook, put it behind a context.
Threading `ReturnType<typeof useX>` down as a prop leaks the hook's whole shape
into every signature below it.
