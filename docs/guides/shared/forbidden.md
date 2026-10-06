# Forbidden

Part of the [style guide](../README.md).

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
  `docs/` or the commit message.
- A user-visible string that does not go through i18n — and it goes into both
  `en.json` and `ru.json`, never one of them.
