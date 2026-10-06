---
paths:
  - 'apps/client/**/*.{ts,tsx}'
---

<!-- Compressed editing rules for the web client, loaded automatically on edit. -->
<!-- The full reasoning is docs/guides/client/slice-ui.md, model-hooks.md and segments.md; keep them in sync. -->

# Code style — client: inside a slice

## Segments

`ui/` components, `model/` hooks and contexts (React), `lib/` pure functions,
`api/` an I/O boundary tied to the slice's domain, `config/` constants. No
separate `hooks/` or `types/` segment. Requests go through the shared axios
instance in `shared/api/http`, never a hand-rolled `fetch`.

## Components

A component lives in a PascalCase folder: `Name.tsx`, `Name.types.ts` (Props),
`Name.module.scss`, `Name.motion.ts` when animated, `index.ts`, and nested
`components/` for subcomponents behind a `components/index.ts` barrel. **100 lines
per JSX file, maximum** — over it, move subcomponents to `components/`, logic to
`model/`, utilities to `lib/`.

A side effect with no markup is its own hook in `model/hooks/` that hands the
component only what it renders (`useTelegramLogin` → `TelegramLoginButton`) —
not a pile of `useEffect` in the component. A hook with
types of its own gets a folder `use-<x>/` with an `index.ts`; its input type is
`Use<Name>Input`.
