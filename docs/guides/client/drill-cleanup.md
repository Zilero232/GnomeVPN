# Drill cleanup

Part of the [style guide](../README.md).

## 17. Drill cleanup

If the data is reachable through a global hook, the leaf fetches it itself
rather than accepting props:

```tsx
// ✗ BAD — drilling
<TelegramPanel status={status} hasEmail={hasEmail} onUnlink={unlink} />;

// ✓ OK — views/account/ui/components/TelegramCard renders <TelegramPanel />
export const TelegramPanel = () => {
  const issue = useIssueCode();
  const { data: status } = useTelegramStatus({ isAwaitingLink: isNonNullish(issue.data) });
  const { hasEmail } = useAccountIdentity();
  const unlink = useUnlinkTelegram();
  // ...
};
```

**Do not parameterise a component for static content:**

```tsx
// ✗ NOT OK — the text never changes
<TelegramCode bot={bot} code={code} hint={t('waiting')} />

// ✓ OK — the copy lives inside, only the dynamic part is a prop
<TelegramCode bot={issued.botUsername} code={issued.code} />
```

**Keep props when:**

- The data comes from a `.map` (`PLANS.map` rendering a `SelectableCard` per plan in `PlanPicker`).
- It is the orchestrator's UI state (`isOpen` in `TelegramUnlinkDialog`).
- A callback needs the parent's context.
