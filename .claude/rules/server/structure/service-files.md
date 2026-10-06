---
paths:
  - 'apps/server/**/*.ts'
---

<!-- Compressed editing rules for the API, loaded automatically on edit. -->
<!-- The full reasoning is docs/guides/server/nestjs.md; keep them in sync. -->

# Code style — server: what a service file holds

## Nothing but the class in a service or controller file

| What                               | Where                                                               |
| ---------------------------------- | ------------------------------------------------------------------- |
| Constants, timeouts, lookup tables | `config/<concern>.config.ts` or `<name>.constants.ts` in its folder |
| Pure functions                     | `lib/<name>/` — one folder per **concern**                          |
| Types                              | `x.types.ts` next to the file that owns them                        |

Import from a module's barrel across boundaries, never reach into its files.
Inside a module, relative paths are fine. The one deliberate exception is
`TelegramNotifyService`, imported by file from billing and the scheduler.
