# Component body order

Part of the [style guide](../README.md).

## 13.5. A component body reads top to bottom

Inside a component the order is fixed: **hooks, then derived values, then
handlers, then the JSX.**

```tsx
// features/account/link-telegram/ui/TelegramPanel.tsx (abridged)
export const TelegramPanel = () => {
  // 1. hooks — every one of them, nothing else between
  const t = useTranslations('telegram');
  const toastError = useToastError();
  const issue = useIssueCode();
  const { data: status, isPending, isError, refetch } = useTelegramStatus({ isAwaitingLink: isNonNullish(issue.data) });
  const unlink = useUnlinkTelegram();

  const [isUnlinkOpen, setIsUnlinkOpen] = useState(false);

  // 2. handlers that act on what the hooks returned
  const onUnlink = () => {
    unlink.mutate(undefined, {
      onSuccess: () => {
        setIsUnlinkOpen(false);
        toast.success(t('unlinked'));
      },
      onError: toastError
    });
  };

  // 3. the markup
  return <div className={s.root}>...</div>;
};
```

Values derived from the hooks (`const issued = issue.data`) sit between the hooks
and the handlers; this component has none above its early returns.

A hook that sits below a plain `const` is the shape that later drifts below a
branch, which React forbids outright. Keeping them in one block makes that
impossible to do by accident, and it means the file reads in dependency order:
nothing is used before the line that produced it.

**Two exceptions, both deliberate.**

A **ref sync** stays between its `useRef` and the `useEffect` that reads it:

```tsx
// features/auth/telegram-sign-in/model/hooks/use-telegram-login/use-telegram-login.ts
const signInRef = useRef(signIn.mutate);

signInRef.current = signIn.mutate;   // must run every render, before the effect

useEffect(() => { ... }, [botUsername, router]);
```

Moving that assignment below the effect breaks it — the effect would read a
stale callback. It is not a derived value, it is part of the ref pattern.

A **value a later hook consumes** should be inlined into the hook call:

```tsx
// no — the derived value splits the hook block
const isAwaitingLink = isNonNullish(issue.data);
const { data: status } = useTelegramStatus({ isAwaitingLink });

// yes — TelegramPanel
const { data: status } = useTelegramStatus({ isAwaitingLink: isNonNullish(issue.data) });
```

Where inlining would genuinely hurt readability — a multi-line filter, a
`useMemo` argument built from several steps — leave the `const` above the hook.
The rule orders declarations; it does not ask you to bury a dependency to
satisfy a layout.
