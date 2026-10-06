# Component size

Part of the [style guide](../README.md).

## 4. Component size

**100 lines per JSX file, maximum.**

Over the line means refactor:

1. Subcomponents → `components/`.
2. Logic → `model/` (a hook).
3. Utilities → the slice's `lib/`.

**A multi-export primitive** (`Dialog` ships `Dialog`, `DialogTrigger`, `DialogContent`,
`DialogHeader`, `DialogTitle`, `DialogDescription`) stays in one file **as long as it
fits the limit** — `ui-kit/molecules/Dialog/Dialog.tsx` is thin wrappers over
`@base-ui/react/dialog`, all six of them in about 40 lines. The moment it goes over, the parts
move out into `components/<Name>/` and `<Name>.tsx` stays as a thin re-export.
Group by meaning, not one file per export: closely related parts
(`Header`/`Title`/`Description`) live together.

Subcomponent nesting may go to a second level (`ui/components/<Name>/components/`) when a
subcomponent has grown of its own accord; nothing in the client needs it today. No deeper
than that — it is a signal that the block should be lifted into a slice of its own.

**Context shared between the parts goes in its own module** next to `<Name>.tsx`, not
inside the component: otherwise `components/*` import the parent and the parent imports
them. Put the context in `model/context/<name>-context.ts` and the provider in a
separate file alongside it (see [segments](segments.md)).
