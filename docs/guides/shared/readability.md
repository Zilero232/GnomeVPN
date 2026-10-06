# Readability

Part of the [style guide](../README.md).

## Destructure wherever it simplifies

The principle: **destructure as much as you can** — for readability. If a value is reached through the dot twice or more, or arrives nested, pull it into a local variable. Less `obj.a.b` noise, and the names speak for themselves.

**Nested access — destructure the parent:**

```ts
// ✗ BAD — node.X repeats
incyServerUri({ config, country: node.country, countryCode: node.countryCode, city: node.city, tls });

// ✓ OK — node pulled apart once
const { country, countryCode, city } = node;

incyServerUri({ config, country, countryCode, city, tls });
```

**Function parameters: 2+ arguments → one destructured object** ([functions](functions.md)). Positional arguments (especially same-typed ones — `string, string, string`) are easy to swap by mistake; an object is self-documenting and order stops mattering.

```ts
// ✗ BAD — three positional strings, easy to mix up
serverName(country, countryCode, city);

// ✓ OK — an object parameter, destructured in the signature
serverName({ country, countryCode, city });
```

**A repeated `obj.x` (2+) goes into a local variable / destructuring:**

```ts
// ✗ BAD
if (file.size === 0) ...;
if (file.size > MAX) ...;
const ext = extension(file.type);

// ✓ OK
const { size, type, name } = file;

if (size === 0) ...;
if (size > MAX) ...;
const ext = extension(type);
```

**When NOT to destructure:**

- A single access — one `obj.x`, and destructuring is ceremony.
- Context is lost — if a bare `name` leaves it unclear whose it is, keep `user.name` or rename (`const { name: nodeName } = ...`).
- A stable namespace object (`router`, `console`, `Math`) — leave it alone.
