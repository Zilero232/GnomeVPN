# Conditional render

Part of the [style guide](../README.md).

## 16. Conditional render — ts-pattern

Three or more render branches call for `match`, not nested
`if (...) return <X />` and not a chain of ternaries inside JSX.

There are two things worth matching on, and both are fine:

**A. A union.** A hook (or the component's own state) holds a union and the view
only matches on it. Reach for this when the assembly is substantial or reused:

```tsx
import { match } from 'ts-pattern';

// views/auth/ui/AuthPage.tsx (inline in its JSX there) — mode is the AuthMode union
return match(mode)
  .with('signup', () => <SignUpForm />)
  .with('signin', () => <SignInForm onForgotPassword={() => setMode('forgot')} />)
  .with('forgot', () => <ForgotPasswordForm onBack={() => setMode('signin')} />)
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

// features/billing/checkout/ui/components/AutoRenewControl (abridged)
return match({ isRecurringAvailable, hasPaymentMethod, cancelAtPeriodEnd })
  .with({ isRecurringAvailable: false }, () => null)
  .with({ hasPaymentMethod: false }, () => <div className={s.prompt}>…</div>)
  .with({ cancelAtPeriodEnd: true }, () => <div className={s.root}>…</div>)
  .otherwise(() => <div className={s.root}>…</div>);
```

The order of `.with` matters — the first matching pattern wins. Take narrowed
values from the handler's argument, which `match` has already narrowed, never
from the closure and never through an `as` cast: a cast sidesteps the check that
makes this worth doing.

**Forbidden either way** — `if` and ternary chains that assemble JSX:

```tsx
// ✗ NOT OK — condition hell in the view
return isPending ? <Spinner /> : isError ? <Unavailable /> : status.isLinked ? <TelegramLinked /> : <TelegramInvite />;
```

**When to move it into a hook:** the state assembly is reused in two or more
places, or the logic is bulky enough that the view stops reading. Otherwise
option B, inline in the view, is normal.

### 15.1 One branch — use `&&`, not `? : null`

A present-or-absent render — one branch, nothing otherwise — is `cond && <X />`,
not `cond ? <X /> : null`:

```tsx
// ✗ NOT OK — a pointless : null
<>
  {isNonNullish(issued) ? <TelegramCode bot={issued.botUsername} code={issued.code} /> : null}
  {mode === 'forgot' ? null : <TelegramLoginButton />}
</>;

// ✓ OK — TelegramPanel, AuthPage
<>
  {isNonNullish(issued) && <TelegramCode bot={issued.botUsername} code={issued.code} />}
  {mode !== 'forgot' && <TelegramLoginButton />}
</>;
```

Invert `cond ? null : <X />` into `!cond && <X />`.

**The condition must be a boolean.** `&&` renders its left operand as-is, so a
non-boolean falsy value (`0`, `''`, `NaN`) prints as literal garbage — a stray
`0` in the markup. Coerce numeric and string checks first:

```tsx
// ✗ DANGEROUS — renders "0" for a plan with no discount
<>{discount && <Badge>{t('save', { percent: discount })}</Badge>}</>;

// ✓ OK — an explicit boolean check (PlanPicker); isEmpty from remeda for arrays
<>
  {discount > 0 && <Badge>{t('save', { percent: discount })}</Badge>}
  {!isEmpty(apps) && <List />}
</>;
```
