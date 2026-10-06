---
paths:
  - '**/_tests/**/*.{ts,tsx}'
  - 'e2e/**/*.spec.ts'
  - '**/vitest.config.*'
  - 'playwright.config.ts'
---

<!-- Auto-loaded when editing tests or their configs. -->
<!-- The full reasoning is docs/guides/shared/testing.md; keep them in sync. -->

# Tests — what to test

## What to test

Only pure logic is covered — anything needing a database, a node over SSH or a
live tunnel is verified by running it.

**Assert the relationship, not the business value.** A test that spells out a
price, a discount or a piece of copy breaks every time somebody changes it for a
commercial reason, and catches nothing when the logic breaks. Import the constant
and compute against it, or assert the property: a longer plan never costs more
per month, the cheapest per-month price undercuts every plan, the discount equals
what the table recomputes. The billing suites did the former and had to be edited
by hand on every repricing.

A test whose two sides both come from the code under test cannot fail. Comparing
a component's default render to the same component rendered with the default
value proves nothing.
