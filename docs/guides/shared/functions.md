# Functions

Part of the [style guide](../README.md).

## 9. Arrow functions: the body

**An arrow whose body is a single `return` is written as an expression.** ESLint
enforces `arrow-body-style: ['error', 'as-needed']` (from the `@siberiacancode/eslint`
preset), so `=> { return x; }` is an error and `bun lint:fix` rewrites it. A block body
is for an arrow that does something before it returns.

```ts
// ✓ OK — shared/constants/routes/routes.ts
export const isPublicRoute = (pathname: string): boolean => PUBLIC_ROUTES.includes(pathname);

// ✓ OK — a block body, because there is work before the return
// features/billing/checkout/model/checkout.helpers.ts
export const redirectToConfirmation = (confirmationUrl: string | null): boolean => {
  if (isNullish(confirmationUrl) || !isBrowser()) {
    return false;
  }

  window.location.assign(confirmationUrl);

  return true;
};

// ✗ NOT OK — arrow-body-style
export const isPublicRoute = (pathname: string): boolean => {
  return PUBLIC_ROUTES.includes(pathname);
};
```

The same holds for components and hooks: `TelegramCard = () => <TelegramPanel />` and
`useIssueCode = () => useMutation({ mutationFn: issueTelegramCode })` are expressions.

### 9.5 `if` / `else` — always with braces

**The body of `if`, `else if` and `else` always goes in `{}`, even for a single line.** A one-liner `if (cond) doThing();` is forbidden: adding a second statement to the branch then needs no structural rewrite, diffs stay cleaner, and there is no "forgot the braces" trap. ESLint does not enforce it — the preset turns no `curly` rule on — so it is kept at review.

```ts
// ✓ OK
if (isUnreachable) {
  return null;
}

if (target) {
  router.replace(target);
}

// ✗ NOT OK
if (isUnreachable) return null;
if (target) router.replace(target);
```

A ternary that returns a value is still fine (it is an expression, not a statement): `return a ? b : c;`.

## Two or more parameters → one object

The shape lives in a sibling `*.types.ts` as `<Fn>Input`, so a call site never has
to guess argument order. One-argument functions stay positional.

```ts
botLink({ bot, code });

// no
botLink(bot, code);
```

`botLink` (`features/account/link-telegram/lib/bot-link`) takes a `BotLinkInput`
declared in `bot-link.types.ts` beside it.

NestJS constructors are not this: injecting collaborators positionally is the
framework's own convention and is used throughout `apps/server`.
