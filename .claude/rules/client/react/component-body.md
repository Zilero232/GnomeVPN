---
paths:
  - 'apps/client/**/*.{ts,tsx}'
---

<!-- Compressed editing rules for the web client, loaded automatically on edit. -->
<!-- The full reasoning is docs/guides/client/component-body.md; keep them in sync. -->

# Code style — client: component body

## A component body reads top to bottom

Hooks first, then the values derived from them, then the handlers that act on
those values, then the JSX. Every hook sits above the first `const` that is not
one, so the dependency order is the reading order and nothing is declared after
something that already used it.

```tsx
const t = useTranslations('incy');
const { data: link, isLoading } = useSubscriptionLink();
const rotate = useRotateLink();

const [isQrOpen, setIsQrOpen] = useState(false);

const onCopy = async ({ value, message, id }: CopyInput) => { ... };

return ( ... );
```

React already forbids a conditional hook; this keeps them visually grouped too,
so a hook added later cannot drift below a branch by accident.

Two shapes legitimately sit between hooks and stay where they are:

- **A ref sync** — `onEventRef.current = onEvent;` between the `useRef` that
  holds it and the `useEffect` that reads it. It has to run on every render,
  before the effect, which is the whole point of the pattern.
- **A value a later hook consumes** — when the expression is only an argument,
  inline it into the hook call. When inlining it would be unreadable, leave the
  `const` where it is: the rule orders declarations, it does not ask you to
  hide a dependency.
