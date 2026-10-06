# Constants and config

Part of the [style guide](../README.md).

## Constants group into objects, and config splits by concern

Values that are read together live in one frozen object rather than side by side
as loose exports. `LINK_CODE.ttlMinutes` says which code it belongs to;
`LINK_CODE_TTL_MINUTES` next to eight other flat constants says only that
somebody had a number.

```ts
// no — a file of unrelated exports, and the reader has to hold the prefixes
export const LINK_CODE_LENGTH = 8;
export const LINK_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const LINK_CODE_TTL_MINUTES = 15;

// yes
export const LINK_CODE = {
  length: 8,
  alphabet: 'ABCDEFGHJKMNPQRSTUVWXYZ23456789',
  ttlMinutes: 15
} as const;
```

A `config/` folder holds one file per concern — `link-code.config.ts`,
`webhook.config.ts`, `callback.config.ts` — not one `<module>.config.ts` that
accumulates everything the module ever needed. The barrel re-exports them, so a
call site still imports from `../config` and never learns the file names.

Two things stay flat: a single value with no siblings, and a name that is part
of a package's public API, where grouping would rename it for every consumer.
