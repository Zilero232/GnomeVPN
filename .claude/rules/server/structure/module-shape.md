---
paths:
  - 'apps/server/**/*.ts'
---

<!-- Compressed editing rules for the API, loaded automatically on edit. -->
<!-- The full reasoning is docs/guides/server/nestjs.md; keep them in sync. -->

# Code style — server: module shape

NestJS on Bun + Prisma 7 + Postgres. Bun runs the TypeScript directly, no build
step.

## Module shape

`x.module.ts` + `x.controller.ts` + `services/`, plus `dto/`, `guards/`, `lib/`,
`config/` as needed. Controllers validate, delegate, return — logic lives in
`services/<domain>.service.ts`, **one service per domain of work**, never a fat
`x.service.ts` at the module root.

There is no facade: a consumer injects the specific domain service it uses, and
the module `exports` only what other modules legitimately call. Helpers shared by
2+ domains go into a `*-shared` service rather than being duplicated.

## DTOs

A DTO wraps a schema from `@gnomevpn/schemas` —
`export class PlatformDto extends createZodDto(platformSchema) {}` — so the client and
the server validate against one definition.
