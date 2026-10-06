# Blank lines

Part of the [style guide](../README.md).

## 13. Let the code breathe

Group statements, don't write a wall. A function body reads as paragraphs, not
one block. Prettier only preserves blank lines and never inserts them, so
`padding-line-between-statements` — configured in the root `eslint.config.mjs` —
does it instead, and `bun run lint:fix` applies it.

**A blank line, enforced:**

- before every `return` / `throw` / `continue` / `break`
- between the `const`/`let` setup block and the logic that acts on it
- around every block — `if`, `for`, `while`, `do`, `switch`, `try`, a function or
  class declaration, an `export`
- around every **multiline** call or `const`

**Kept by hand:** a blank line before an `await` that starts a logically separate
step.

**No blank line:**

- between consecutive `const`/`let` declarations of one setup block
- inside a tight group of consecutive one-line statements — they stay grouped on purpose
- ever two in a row

```ts
// no — monolithic
const url = new URL(`${HYSTERIA2_SCHEME}://${config.server}`);
url.username = config.auth;
url.port = String(config.port);
if (canPin) {
  url.searchParams.set('pinSHA256', pinned);
}
return url.toString();

// yes — subscription-link/lib/incy-uri/hysteria2/hysteria2.ts (abridged)
const url = new URL(`${HYSTERIA2_SCHEME}://${config.server}`);
const pinned = config.certFingerprint ? pinnedFingerprint(config.certFingerprint) : null;
const canPin = tls === TLS_MODE.pin && isNonNullish(pinned);

url.username = config.auth;
url.port = String(config.port);
url.pathname = '/';

if (canPin) {
  url.searchParams.set('pinSHA256', pinned);
}

url.hash = serverName({ country, countryCode, city });

return url.toString();
```

Several early returns each get their own block and their own blank line — the
braces are required ([functions](functions.md) §9.5):

```tsx
// features/account/link-telegram/ui/TelegramPanel.tsx
if (isPending) {
  return <div className={s.loading}>…</div>;
}

if (isError || !status) {
  return <div className={s.root}>…</div>;
}

return <div className={s.root}>…</div>;
```
