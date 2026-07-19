# VPS Node Provisioning Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One command (`bun run provision:nodes`) that takes a JSON list of bare VPS hosts and turns each into a working, registered GnomeVPN VPN node — Docker + wg-easy installed over SSH, firewall locked down, panel password written to `apps/server/.env`, and a `Node` row upserted in Postgres.

**Architecture:** A single Bun/TypeScript script (`infra/provision/provision-nodes.ts`) reads and Zod-validates `infra/provision/nodes.json`, then for each host sequentially: connects over SSH (`node-ssh`, password auth), ensures Docker, resolves/writes the wg-easy panel password, ships the compose stack, configures `ufw`, starts the stack, health-checks it via the existing `WgEasyClient.health()`, appends the `WG_KEY_<CODE>` env line, and upserts the `Node` row via a shared helper extracted from the existing `seed-node.ts`. Per-host failures are isolated and reported in a summary table; the process exits non-zero if any host failed.

**Tech Stack:** Bun, TypeScript, `node-ssh` (SSH2 with promises), Zod 4, Prisma 7 (`basePrisma`), the existing `WgEasyClient` (`apps/server/src/lib/wg-easy.ts`), `bcryptjs` (already a transitive dep via wg-easy tooling, added directly here), Vitest.

## Global Constraints

- **No code comments** (`//`, JSDoc) except where explicitly requested. Code is self-documenting through names. (project-wide rule, `docs/style.md`)
- **English identifiers; single quotes; no `bun:test`** — this project uses Vitest exclusively (`vitest`, `vi.fn()`, `vi.stubGlobal`), never `bun:test`.
- **Zod is the single source of truth** for any validated shape (Zod 4 top-level API: `z.ipv4()`, `z.email()` style — not `z.string().ip()`).
- **Tests live in `_tests/` subfolders** next to the code they cover (e.g. `infra/provision/_tests/foo.test.ts`), matching `apps/server/src/**/_tests/` convention already in this repo.
- **No git commits inside task steps unless the plan step explicitly says so** — this plan's steps DO say so (per-task commits are standard for this workflow); the executor should follow the plan's own Commit steps, not skip or add extra ones.
- **`infra/provision/nodes.json` must never be committed** — it holds VPS root passwords. `.gitignore` must cover it before the example/template file is ever created, so a slip in ordering can't leak a real file.
- **`WgEasyClient`'s real REST contract**: bare `Authorization: <password>` header (no `Bearer` prefix), `POST /api/wireguard/client` returns only `{success:true}` with no keys, panel password is compared via bcrypt server-side (`PASSWORD_HASH` env var on the wg-easy container) — this repo already reverse-engineered and encoded this in `apps/server/src/lib/wg-easy.ts` and `infra/wg-easy/README.md`. Do not deviate.
- **`$` in a bcrypt hash must be doubled (`$$`) when written into a docker-compose `.env` file**, or docker compose interpolates fragments of the hash as variables and truncates it. This repo already discovered and documented this (`infra/wg-easy/README.md`); any code that writes a wg-easy `.env` on a remote host must apply this escaping.

---

## File Structure

```text
infra/
  provision/
    nodes.example.json          # committed template (no real secrets)
    nodes.json                  # gitignored — real host list with passwords
    provision-nodes.ts          # entry point, orchestrates the per-host pipeline
    lib/
      nodes-config.ts           # Zod schema + loader for nodes.json
      env-file.ts                # idempotent "append KEY=VALUE if absent" helper for apps/server/.env
      ssh-client.ts               # thin wrapper around node-ssh: connect, execCommand, putFile
      provision-host.ts          # the 8-step per-host pipeline (uses ssh-client, env-file, wg-easy client, node-upsert)
      _tests/
        nodes-config.test.ts
        env-file.test.ts
        provision-host.test.ts
apps/server/
  scripts/
    lib/
      upsert-node.ts             # extracted from seed-node.ts; shared by seed-node.ts and provision-nodes.ts
      _tests/
        upsert-node.test.ts
    seed-node.ts                 # MODIFIED: now calls the shared upsertNode() helper
  package.json                   # no changes needed here (provisioning lives at repo root, not per-package)
package.json                    # MODIFIED: add "provision:nodes" script, add node-ssh + bcryptjs deps
.gitignore                      # MODIFIED: add infra/provision/nodes.json
```

**Why this split:** `provision-nodes.ts` is the thin CLI entry point (argument parsing, loop over hosts, summary printing) — it stays small and easy to read end-to-end. Each concern (SSH transport, env-file editing, host-config validation, the actual per-host pipeline) is its own file so it can be unit-tested in isolation from real SSH/network calls, per the design doc's testing strategy. `upsert-node.ts` is extracted to `apps/server/scripts/lib/` (not `infra/provision/`) because it depends on `basePrisma` and the `Node` Prisma model, which live in `apps/server` — `infra/provision/provision-host.ts` imports it from there via a relative path, matching how `seed-node.ts` already imports `basePrisma` from `../src/core`.

---

## Task 1: `nodes.json` schema, loader, and gitignore entry

**Files:**
- Create: `infra/provision/lib/nodes-config.ts`
- Create: `infra/provision/nodes.example.json`
- Create: `infra/provision/_tests/nodes-config.test.ts`
- Modify: `.gitignore`

**Interfaces:**
- Produces: `nodeConfigSchema` (Zod schema), `NodeConfig` (inferred type: `{ host: string; sshUser: string; sshPassword: string; country: string; countryCode: string; flagEmoji: string; city?: string }`), `loadNodesConfig(filePath: string): Promise<NodeConfig[]>` — reads the file, parses JSON, validates with Zod, throws with a clear message listing every invalid entry if validation fails (not just the first).

- [ ] **Step 1: Add the gitignore entry first, before anything else touches this directory**

Edit `.gitignore`, append after the existing `.env.local` line:

```gitignore
infra/provision/nodes.json
```

Verify: `cat .gitignore` shows the new line. This must land before Step 2 creates any file in `infra/provision/`, so there is never a window where a real `nodes.json` could be accidentally staged.

- [ ] **Step 2: Write the failing test for the schema and loader**

Create `infra/provision/_tests/nodes-config.test.ts`:

```ts
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { loadNodesConfig } from '../lib/nodes-config';

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'gnomevpn-nodes-config-'));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('loadNodesConfig', () => {
  it('parses a valid list', async () => {
    const filePath = join(dir, 'nodes.json');
    await writeFile(
      filePath,
      JSON.stringify([
        {
          host: '203.0.113.10',
          sshUser: 'root',
          sshPassword: 'secret',
          country: 'Germany',
          countryCode: 'DE',
          flagEmoji: '🇩🇪',
          city: 'Frankfurt',
        },
      ]),
    );

    const nodes = await loadNodesConfig(filePath);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].host).toBe('203.0.113.10');
    expect(nodes[0].city).toBe('Frankfurt');
  });

  it('allows city to be omitted', async () => {
    const filePath = join(dir, 'nodes.json');
    await writeFile(
      filePath,
      JSON.stringify([
        {
          host: '203.0.113.10',
          sshUser: 'root',
          sshPassword: 'secret',
          country: 'Germany',
          countryCode: 'DE',
          flagEmoji: '🇩🇪',
        },
      ]),
    );

    const nodes = await loadNodesConfig(filePath);

    expect(nodes[0].city).toBeUndefined();
  });

  it('throws listing every invalid entry, not just the first', async () => {
    const filePath = join(dir, 'nodes.json');
    await writeFile(
      filePath,
      JSON.stringify([
        { host: '', sshUser: 'root', sshPassword: 'x', country: 'A', countryCode: 'AA', flagEmoji: '🏳️' },
        { host: '203.0.113.11', sshUser: '', sshPassword: 'x', country: 'B', countryCode: 'BB', flagEmoji: '🏳️' },
      ]),
    );

    await expect(loadNodesConfig(filePath)).rejects.toThrow(/index 0/);
    await expect(loadNodesConfig(filePath)).rejects.toThrow(/index 1/);
  });

  it('throws a clear error when the file does not exist', async () => {
    await expect(loadNodesConfig(join(dir, 'missing.json'))).rejects.toThrow();
  });
});
```

- [ ] **Step 2b: Run the test to verify it fails**

Run: `cd infra/provision && bunx vitest run _tests/nodes-config.test.ts`
Expected: FAIL — `Cannot find module '../lib/nodes-config'`

- [ ] **Step 3: Implement the schema and loader**

Create `infra/provision/lib/nodes-config.ts`:

```ts
import { readFile } from 'node:fs/promises';
import { z } from 'zod';

export const nodeConfigSchema = z.object({
  host: z.string().min(1),
  sshUser: z.string().min(1),
  sshPassword: z.string().min(1),
  country: z.string().min(1),
  countryCode: z.string().length(2),
  flagEmoji: z.string().min(1),
  city: z.string().min(1).optional(),
});

export type NodeConfig = z.infer<typeof nodeConfigSchema>;

export const loadNodesConfig = async (filePath: string): Promise<NodeConfig[]> => {
  const raw = await readFile(filePath, 'utf8');
  const parsed = JSON.parse(raw);
  const result = z.array(nodeConfigSchema).safeParse(parsed);

  if (!result.success) {
    const messages = result.error.issues.map(
      (issue) => `index ${issue.path[0]}: ${issue.path.slice(1).join('.')} — ${issue.message}`,
    );
    throw new Error(`Invalid infra/provision/nodes.json:\n${messages.join('\n')}`);
  }

  return result.data;
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd infra/provision && bunx vitest run _tests/nodes-config.test.ts`
Expected: PASS, 4 tests passing.

- [ ] **Step 5: Create the committed example template**

Create `infra/provision/nodes.example.json`:

```json
[
  {
    "host": "203.0.113.10",
    "sshUser": "root",
    "sshPassword": "REPLACE_ME",
    "country": "Germany",
    "countryCode": "DE",
    "flagEmoji": "🇩🇪",
    "city": "Frankfurt"
  }
]
```

- [ ] **Step 6: Commit**

```bash
git add .gitignore infra/provision/lib/nodes-config.ts infra/provision/_tests/nodes-config.test.ts infra/provision/nodes.example.json
git commit -m "feat(provision): add nodes.json schema and loader"
```

---

## Task 2: idempotent env-file append helper

**Files:**
- Create: `infra/provision/lib/env-file.ts`
- Create: `infra/provision/_tests/env-file.test.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `hasEnvKey(filePath: string, key: string): Promise<boolean>` — true if a line `KEY=...` (any value) exists in the file; `appendEnvLine(filePath: string, key: string, value: string): Promise<void>` — appends `KEY=value\n` to the file, creating the file if it doesn't exist, and throws if the key already exists (caller must check `hasEnvKey` first — this makes the "never silently overwrite" contract explicit at the type level rather than a runtime silent no-op that's easy to misuse); `readEnvValue(filePath: string, key: string): Promise<string | null>` — returns the value of `KEY=...` if present, else `null` (used to resolve an existing wg-easy password on re-runs).

- [ ] **Step 1: Write the failing tests**

Create `infra/provision/_tests/env-file.test.ts`:

```ts
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { appendEnvLine, hasEnvKey, readEnvValue } from '../lib/env-file';

let dir: string;
let filePath: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'gnomevpn-env-file-'));
  filePath = join(dir, '.env');
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('hasEnvKey', () => {
  it('returns false when the file does not exist', async () => {
    expect(await hasEnvKey(filePath, 'WG_KEY_DE')).toBe(false);
  });

  it('returns false when the key is absent', async () => {
    await writeFile(filePath, 'OTHER_KEY=value\n');
    expect(await hasEnvKey(filePath, 'WG_KEY_DE')).toBe(false);
  });

  it('returns true when the key is present', async () => {
    await writeFile(filePath, 'WG_KEY_DE=secret\n');
    expect(await hasEnvKey(filePath, 'WG_KEY_DE')).toBe(true);
  });

  it('does not match a key that is a prefix of another key', async () => {
    await writeFile(filePath, 'WG_KEY_DE_OLD=secret\n');
    expect(await hasEnvKey(filePath, 'WG_KEY_DE')).toBe(false);
  });
});

describe('readEnvValue', () => {
  it('returns the value when the key is present', async () => {
    await writeFile(filePath, 'WG_KEY_DE=secret123\n');
    expect(await readEnvValue(filePath, 'WG_KEY_DE')).toBe('secret123');
  });

  it('returns null when the key is absent', async () => {
    await writeFile(filePath, 'OTHER=x\n');
    expect(await readEnvValue(filePath, 'WG_KEY_DE')).toBeNull();
  });

  it('returns null when the file does not exist', async () => {
    expect(await readEnvValue(filePath, 'WG_KEY_DE')).toBeNull();
  });
});

describe('appendEnvLine', () => {
  it('creates the file and appends the line when the file does not exist', async () => {
    await appendEnvLine(filePath, 'WG_KEY_DE', 'secret');
    expect(await readEnvValue(filePath, 'WG_KEY_DE')).toBe('secret');
  });

  it('appends to an existing file without disturbing other lines', async () => {
    await writeFile(filePath, 'EXISTING=1\n');
    await appendEnvLine(filePath, 'WG_KEY_DE', 'secret');
    expect(await readEnvValue(filePath, 'EXISTING')).toBe('1');
    expect(await readEnvValue(filePath, 'WG_KEY_DE')).toBe('secret');
  });

  it('throws when the key already exists, refusing to silently overwrite', async () => {
    await writeFile(filePath, 'WG_KEY_DE=old\n');
    await expect(appendEnvLine(filePath, 'WG_KEY_DE', 'new')).rejects.toThrow(/already exists/);
    expect(await readEnvValue(filePath, 'WG_KEY_DE')).toBe('old');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd infra/provision && bunx vitest run _tests/env-file.test.ts`
Expected: FAIL — `Cannot find module '../lib/env-file'`

- [ ] **Step 3: Implement the helper**

Create `infra/provision/lib/env-file.ts`:

```ts
import { appendFile, readFile } from 'node:fs/promises';

const readLines = async (filePath: string): Promise<string[]> => {
  try {
    const raw = await readFile(filePath, 'utf8');
    return raw.split('\n');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
};

const findLine = (lines: string[], key: string): string | undefined =>
  lines.find((line) => line.startsWith(`${key}=`));

export const hasEnvKey = async (filePath: string, key: string): Promise<boolean> =>
  findLine(await readLines(filePath), key) !== undefined;

export const readEnvValue = async (filePath: string, key: string): Promise<string | null> => {
  const line = findLine(await readLines(filePath), key);
  return line ? line.slice(key.length + 1) : null;
};

export const appendEnvLine = async (
  filePath: string,
  key: string,
  value: string,
): Promise<void> => {
  if (await hasEnvKey(filePath, key)) {
    throw new Error(`Refusing to append ${key}: it already exists in ${filePath}`);
  }

  await appendFile(filePath, `${key}=${value}\n`);
};
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd infra/provision && bunx vitest run _tests/env-file.test.ts`
Expected: PASS, 10 tests passing.

- [ ] **Step 5: Commit**

```bash
git add infra/provision/lib/env-file.ts infra/provision/_tests/env-file.test.ts
git commit -m "feat(provision): add idempotent env-file append helper"
```

---

## Task 3: extract shared `upsertNode` helper from `seed-node.ts`

**Files:**
- Create: `apps/server/scripts/lib/upsert-node.ts`
- Create: `apps/server/scripts/lib/_tests/upsert-node.test.ts`
- Modify: `apps/server/scripts/seed-node.ts`

**Interfaces:**
- Consumes: `basePrisma` from `apps/server/src/core` (existing).
- Produces: `upsertNode(prisma: PrismaLike, input: UpsertNodeInput): Promise<UpsertNodeResult>` where `UpsertNodeInput = { country: string; countryCode: string; flagEmoji: string; city?: string; publicEndpoint: string; wgEasyUrl: string; wgEasyApiKeyRef: string }` and `UpsertNodeResult = { id: string; wasExisting: boolean }`. `PrismaLike` is a minimal structural type (`{ node: { findFirst: ...; update: ...; create: ... } }`) so the function is testable against a fake without importing the full generated Prisma client type.

This task is a pure refactor: `seed-node.ts`'s current inline upsert-by-`publicEndpoint` logic becomes the reusable function; behavior is unchanged, verified by keeping `seed-node.ts` working exactly as before.

- [ ] **Step 1: Write the failing test for the extracted helper**

Create `apps/server/scripts/lib/_tests/upsert-node.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';

import { upsertNode } from '../upsert-node';

const baseInput = {
  country: 'Germany',
  countryCode: 'DE',
  flagEmoji: '🇩🇪',
  city: 'Frankfurt',
  publicEndpoint: '203.0.113.10:51820',
  wgEasyUrl: 'http://203.0.113.10:51821',
  wgEasyApiKeyRef: 'WG_KEY_DE',
};

describe('upsertNode', () => {
  it('creates a new node when none exists for the endpoint', async () => {
    const create = vi.fn(async () => ({ id: 'new-id' }));
    const fakePrisma = {
      node: { findFirst: vi.fn(async () => null), update: vi.fn(), create },
    } as never;

    const result = await upsertNode(fakePrisma, baseInput);

    expect(result).toEqual({ id: 'new-id', wasExisting: false });
    expect(create).toHaveBeenCalledWith({
      data: {
        country: 'Germany',
        countryCode: 'DE',
        flagEmoji: '🇩🇪',
        city: 'Frankfurt',
        publicEndpoint: '203.0.113.10:51820',
        wgEasyUrl: 'http://203.0.113.10:51821',
        wgEasyApiKeyRef: 'WG_KEY_DE',
        enabled: true,
      },
    });
  });

  it('updates the existing node when one is found for the endpoint', async () => {
    const update = vi.fn(async () => ({ id: 'existing-id' }));
    const fakePrisma = {
      node: {
        findFirst: vi.fn(async () => ({ id: 'existing-id' })),
        update,
        create: vi.fn(),
      },
    } as never;

    const result = await upsertNode(fakePrisma, baseInput);

    expect(result).toEqual({ id: 'existing-id', wasExisting: true });
    expect(update).toHaveBeenCalledWith({
      where: { id: 'existing-id' },
      data: {
        country: 'Germany',
        countryCode: 'DE',
        flagEmoji: '🇩🇪',
        city: 'Frankfurt',
        wgEasyUrl: 'http://203.0.113.10:51821',
        wgEasyApiKeyRef: 'WG_KEY_DE',
        enabled: true,
      },
    });
  });

  it('looks up the existing node by publicEndpoint', async () => {
    const findFirst = vi.fn(async () => null);
    const fakePrisma = {
      node: { findFirst, update: vi.fn(), create: vi.fn(async () => ({ id: 'x' })) },
    } as never;

    await upsertNode(fakePrisma, baseInput);

    expect(findFirst).toHaveBeenCalledWith({ where: { publicEndpoint: '203.0.113.10:51820' } });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd apps/server && bun run test -- lib/_tests/upsert-node.test.ts`
Expected: FAIL — `Cannot find module '../upsert-node'`

- [ ] **Step 3: Implement the extracted helper**

Create `apps/server/scripts/lib/upsert-node.ts`:

```ts
type NodeRow = { id: string };

type PrismaLike = {
  node: {
    findFirst: (args: { where: { publicEndpoint: string } }) => Promise<NodeRow | null>;
    update: (args: { where: { id: string }; data: Record<string, unknown> }) => Promise<NodeRow>;
    create: (args: { data: Record<string, unknown> }) => Promise<NodeRow>;
  };
};

export type UpsertNodeInput = {
  country: string;
  countryCode: string;
  flagEmoji: string;
  city?: string;
  publicEndpoint: string;
  wgEasyUrl: string;
  wgEasyApiKeyRef: string;
};

export type UpsertNodeResult = {
  id: string;
  wasExisting: boolean;
};

export const upsertNode = async (
  prisma: PrismaLike,
  input: UpsertNodeInput,
): Promise<UpsertNodeResult> => {
  const existing = await prisma.node.findFirst({
    where: { publicEndpoint: input.publicEndpoint },
  });

  if (existing) {
    const updated = await prisma.node.update({
      where: { id: existing.id },
      data: {
        country: input.country,
        countryCode: input.countryCode,
        flagEmoji: input.flagEmoji,
        city: input.city,
        wgEasyUrl: input.wgEasyUrl,
        wgEasyApiKeyRef: input.wgEasyApiKeyRef,
        enabled: true,
      },
    });

    return { id: updated.id, wasExisting: true };
  }

  const created = await prisma.node.create({
    data: {
      country: input.country,
      countryCode: input.countryCode,
      flagEmoji: input.flagEmoji,
      city: input.city,
      publicEndpoint: input.publicEndpoint,
      wgEasyUrl: input.wgEasyUrl,
      wgEasyApiKeyRef: input.wgEasyApiKeyRef,
      enabled: true,
    },
  });

  return { id: created.id, wasExisting: false };
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd apps/server && bun run test -- lib/_tests/upsert-node.test.ts`
Expected: PASS, 3 tests passing.

- [ ] **Step 5: Rewrite `seed-node.ts` to use the extracted helper**

Read the current file first: `apps/server/scripts/seed-node.ts`. Replace its body with:

```ts
import { basePrisma } from '../src/core';
import { upsertNode } from './lib/upsert-node';

const main = async () => {
  const country = process.env.SEED_COUNTRY ?? 'Germany';
  const countryCode = process.env.SEED_COUNTRY_CODE ?? 'DE';
  const flagEmoji = process.env.SEED_FLAG ?? '🇩🇪';
  const city = process.env.SEED_CITY;
  const publicEndpoint = process.env.SEED_ENDPOINT;
  const wgEasyUrl = process.env.SEED_WG_EASY_URL;
  const wgEasyApiKeyRef = process.env.SEED_WG_EASY_KEY_REF ?? 'WG_EASY_KEY_DE';

  if (!publicEndpoint || !wgEasyUrl) {
    throw new Error('SEED_ENDPOINT and SEED_WG_EASY_URL are required');
  }

  if (!process.env[wgEasyApiKeyRef]) {
    process.stdout.write(
      `Warning: ${wgEasyApiKeyRef} is not set in this environment; connect will fail with NODE_UNAVAILABLE until it is.\n`,
    );
  }

  const result = await upsertNode(basePrisma, {
    country,
    countryCode,
    flagEmoji,
    city,
    publicEndpoint,
    wgEasyUrl,
    wgEasyApiKeyRef,
  });

  process.stdout.write(
    `${result.wasExisting ? 'Updated' : 'Seeded'} node ${result.id} (${country}, ${publicEndpoint})\n`,
  );

  await basePrisma.$disconnect();
};

void main();
```

- [ ] **Step 6: Verify the full server suite still passes and typechecks**

Run: `cd apps/server && bun run test`
Expected: PASS, all existing tests plus the 3 new ones (19 total, up from 16).

Run: `bun --filter @gnomevpn/server typecheck` (from repo root `c:/Projects/gnomevpn`)
Expected: exit code 0.

- [ ] **Step 7: Commit**

```bash
git add apps/server/scripts/lib/upsert-node.ts apps/server/scripts/lib/_tests/upsert-node.test.ts apps/server/scripts/seed-node.ts
git commit -m "refactor(server): extract shared upsertNode helper from seed-node.ts"
```

---

## Task 4: SSH client wrapper

**Files:**
- Create: `infra/provision/lib/ssh-client.ts`
- Create: `infra/provision/_tests/ssh-client.test.ts`
- Modify: `package.json` (add `node-ssh` dependency)

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `SshClient` class with `connect(opts: { host: string; username: string; password: string }): Promise<void>`, `exec(command: string): Promise<{ stdout: string; stderr: string; exitCode: number }>`, `putFile(localContent: string, remotePath: string): Promise<void>` (writes a string directly to a remote path — wraps `node-ssh`'s file-based `putFile` by writing the content to a local temp file first, since `node-ssh` has no put-from-string method), `dispose(): void`. This wraps `node-ssh`'s `NodeSSH` so the rest of the codebase never imports `node-ssh` directly — only this one file does, keeping the third-party API surface contained per the design's "small, focused files" principle.

- [ ] **Step 1: Install `node-ssh`**

Run (from repo root `c:/Projects/gnomevpn`): `bun add node-ssh`
Expected: adds `node-ssh` to root `package.json` dependencies (this is a root-level tool, not scoped to `apps/server` or any workspace package, since `infra/provision` is not itself a workspace package).

- [ ] **Step 2: Write the failing test**

Create `infra/provision/_tests/ssh-client.test.ts`. This test mocks `node-ssh`'s `NodeSSH` class rather than connecting to a real host — real-host behavior is covered by the manual verification in Task 6's final step, per the design doc's testing strategy (no automated test for real SSH/network I/O).

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SshClient } from '../lib/ssh-client';

vi.mock('node-ssh', () => {
  const connect = vi.fn(async () => undefined);
  const execCommand = vi.fn(async () => ({ stdout: 'ok', stderr: '', code: 0 }));
  const putFile = vi.fn(async () => undefined);
  const dispose = vi.fn();

  return {
    NodeSSH: vi.fn().mockImplementation(() => ({ connect, execCommand, putFile, dispose })),
  };
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('SshClient', () => {
  it('connects with the given credentials', async () => {
    const { NodeSSH } = await import('node-ssh');
    const client = new SshClient();

    await client.connect({ host: '203.0.113.10', username: 'root', password: 'secret' });

    const instance = vi.mocked(NodeSSH).mock.results[0].value;
    expect(instance.connect).toHaveBeenCalledWith({
      host: '203.0.113.10',
      username: 'root',
      password: 'secret',
    });
  });

  it('runs a command and normalizes the result shape', async () => {
    const client = new SshClient();
    await client.connect({ host: '203.0.113.10', username: 'root', password: 'secret' });

    const result = await client.exec('docker --version');

    expect(result).toEqual({ stdout: 'ok', stderr: '', exitCode: 0 });
  });

  it('disposes the underlying connection', async () => {
    const { NodeSSH } = await import('node-ssh');
    const client = new SshClient();
    await client.connect({ host: '203.0.113.10', username: 'root', password: 'secret' });

    client.dispose();

    const instance = vi.mocked(NodeSSH).mock.results[0].value;
    expect(instance.dispose).toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `cd infra/provision && bunx vitest run _tests/ssh-client.test.ts`
Expected: FAIL — `Cannot find module '../lib/ssh-client'`

- [ ] **Step 4: Implement the wrapper**

Create `infra/provision/lib/ssh-client.ts`:

```ts
import { writeFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { NodeSSH } from 'node-ssh';

export type SshExecResult = {
  stdout: string;
  stderr: string;
  exitCode: number;
};

export class SshClient {
  private readonly ssh = new NodeSSH();

  async connect(opts: { host: string; username: string; password: string }): Promise<void> {
    await this.ssh.connect({ host: opts.host, username: opts.username, password: opts.password });
  }

  async exec(command: string): Promise<SshExecResult> {
    const result = await this.ssh.execCommand(command);

    return { stdout: result.stdout, stderr: result.stderr, exitCode: result.code ?? 0 };
  }

  async putFile(localContent: string, remotePath: string): Promise<void> {
    const dir = await mkdtemp(join(tmpdir(), 'gnomevpn-ssh-put-'));
    const localPath = join(dir, 'payload');

    try {
      await writeFile(localPath, localContent, 'utf8');
      await this.ssh.putFile(localPath, remotePath);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }

  dispose(): void {
    this.ssh.dispose();
  }
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `cd infra/provision && bunx vitest run _tests/ssh-client.test.ts`
Expected: PASS, 3 tests passing.

- [ ] **Step 6: Commit**

```bash
git add package.json bun.lock infra/provision/lib/ssh-client.ts infra/provision/_tests/ssh-client.test.ts
git commit -m "feat(provision): add SSH client wrapper over node-ssh"
```

---

## Task 5: password resolution and generation helper

**Files:**
- Create: `infra/provision/lib/panel-password.ts`
- Create: `infra/provision/_tests/panel-password.test.ts`
- Modify: `package.json` (add `bcryptjs` dependency)

**Interfaces:**
- Consumes: `hasEnvKey`, `readEnvValue` from `infra/provision/lib/env-file.ts` (Task 2).
- Produces: `resolvePanelPassword(envFilePath: string, countryCode: string): Promise<{ password: string; isNew: boolean }>` — reads `WG_KEY_<COUNTRYCODE>` from the given env file; if present, returns it with `isNew: false`; if absent, generates a new random password (32 hex chars via `node:crypto`'s `randomBytes(16).toString('hex')`) and returns it with `isNew: true` (does NOT write it to the file — that's the caller's job in Task 7, after the VPS-side provisioning succeeds, so a mid-provisioning failure doesn't leave an env line pointing at a node that was never actually set up). `hashPanelPassword(password: string): Promise<string>` — bcrypt-hashes a password (cost factor 12, matching `infra/wg-easy/README.md`'s documented approach) and returns the hash with every `$` doubled to `$$`, ready to be written directly into a docker-compose `.env` file on the remote host.

- [ ] **Step 1: Install `bcryptjs`**

Run (from repo root): `bun add bcryptjs && bun add -D @types/bcryptjs`
Expected: adds both to root `package.json`.

- [ ] **Step 2: Write the failing tests**

Create `infra/provision/_tests/panel-password.test.ts`:

```ts
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { compare } from 'bcryptjs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { hashPanelPassword, resolvePanelPassword } from '../lib/panel-password';

let dir: string;
let envPath: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'gnomevpn-panel-password-'));
  envPath = join(dir, '.env');
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('resolvePanelPassword', () => {
  it('reuses an existing password and marks it as not new', async () => {
    await writeFile(envPath, 'WG_KEY_DE=existing-secret\n');

    const result = await resolvePanelPassword(envPath, 'DE');

    expect(result).toEqual({ password: 'existing-secret', isNew: false });
  });

  it('generates a new password when none exists', async () => {
    const result = await resolvePanelPassword(envPath, 'DE');

    expect(result.isNew).toBe(true);
    expect(result.password.length).toBeGreaterThanOrEqual(32);
  });

  it('generates a different password on each call when none exists', async () => {
    const first = await resolvePanelPassword(envPath, 'DE');
    const second = await resolvePanelPassword(envPath, 'DE');

    expect(first.password).not.toBe(second.password);
  });
});

describe('hashPanelPassword', () => {
  it('produces a bcrypt hash that verifies against the original password', async () => {
    const hash = await hashPanelPassword('my-password');
    const unescaped = hash.replace(/\$\$/g, '$');

    expect(await compare('my-password', unescaped)).toBe(true);
  });

  it('doubles every dollar sign in the hash', async () => {
    const hash = await hashPanelPassword('my-password');

    expect(hash).not.toMatch(/(?<!\$)\$(?!\$)/);
    expect(hash.split('$$').length).toBeGreaterThan(1);
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `cd infra/provision && bunx vitest run _tests/panel-password.test.ts`
Expected: FAIL — `Cannot find module '../lib/panel-password'`

- [ ] **Step 4: Implement the helper**

Create `infra/provision/lib/panel-password.ts`:

```ts
import { randomBytes } from 'node:crypto';
import { hash } from 'bcryptjs';

import { hasEnvKey, readEnvValue } from './env-file';

const BCRYPT_COST = 12;

export const resolvePanelPassword = async (
  envFilePath: string,
  countryCode: string,
): Promise<{ password: string; isNew: boolean }> => {
  const key = `WG_KEY_${countryCode}`;

  if (await hasEnvKey(envFilePath, key)) {
    const password = await readEnvValue(envFilePath, key);
    return { password: password as string, isNew: false };
  }

  return { password: randomBytes(16).toString('hex'), isNew: true };
};

export const hashPanelPassword = async (password: string): Promise<string> => {
  const hashed = await hash(password, BCRYPT_COST);
  return hashed.replace(/\$/g, '$$$$');
};
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `cd infra/provision && bunx vitest run _tests/panel-password.test.ts`
Expected: PASS, 5 tests passing.

- [ ] **Step 6: Commit**

```bash
git add package.json bun.lock infra/provision/lib/panel-password.ts infra/provision/_tests/panel-password.test.ts
git commit -m "feat(provision): add panel password resolution and bcrypt hashing"
```

---

## Task 6: the per-host provisioning pipeline

**Files:**
- Create: `infra/provision/lib/provision-host.ts`
- Create: `infra/provision/_tests/provision-host.test.ts`

**Interfaces:**
- Consumes: `SshClient` (Task 4), `resolvePanelPassword`, `hashPanelPassword` (Task 5), `appendEnvLine` (Task 2), `upsertNode` (Task 3, imported from `../../../apps/server/scripts/lib/upsert-node`), `WgEasyClient` (existing, imported from `../../../apps/server/src/lib/wg-easy`), `NodeConfig` (Task 1).
- Produces: `provisionHost(config: NodeConfig, opts: { backendIp?: string; serverEnvPath: string; wgEasyComposeContent: string }): Promise<ProvisionResult>` where `ProvisionResult = { host: string; country: string; status: 'provisioned' | 'updated' | 'failed'; error?: string }`. This is the single function that runs the full 8-step pipeline from the design doc for one host, catching any thrown error and converting it into a `failed` result rather than propagating — so the caller (Task 7's orchestrator) can run this per host and never has one host's failure abort the batch.

This is the most complex unit in the plan. It is designed to take its collaborators as constructor-injected/parameter-injected dependencies specifically so the test below can substitute a fake `SshClient` and a fake `WgEasyClient` and verify the *sequence and content* of calls without touching a real network — matching the design doc's stated testing strategy of unit-testing the pipeline's logic against fakes, with only the true SSH/Docker/HTTP orchestration left for manual verification.

- [ ] **Step 1: Write the failing test for the full pipeline against fakes**

Create `infra/provision/_tests/provision-host.test.ts`:

```ts
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { provisionHost } from '../lib/provision-host';

const baseConfig = {
  host: '203.0.113.10',
  sshUser: 'root',
  sshPassword: 'ssh-secret',
  country: 'Germany',
  countryCode: 'DE',
  flagEmoji: '🇩🇪',
  city: 'Frankfurt',
};

let dir: string;
let serverEnvPath: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'gnomevpn-provision-host-'));
  serverEnvPath = join(dir, '.env');
  await writeFile(serverEnvPath, '');
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

const makeFakeSsh = (execResults: Record<string, { stdout: string; exitCode: number }>) => ({
  connect: vi.fn(async () => undefined),
  exec: vi.fn(async (command: string) => {
    const match = Object.entries(execResults).find(([prefix]) => command.startsWith(prefix));
    return match ? { stdout: match[1].stdout, stderr: '', exitCode: match[1].exitCode } : { stdout: '', stderr: '', exitCode: 0 };
  }),
  putFile: vi.fn(async () => undefined),
  dispose: vi.fn(),
});

const makeFakeUpsertNode = () => vi.fn(async () => ({ id: 'node-id', wasExisting: false }));

describe('provisionHost', () => {
  it('runs the full pipeline and returns a provisioned result when docker is already installed', async () => {
    const fakeSsh = makeFakeSsh({
      'docker --version': { stdout: 'Docker version 27.0.0', exitCode: 0 },
      'command -v ufw': { stdout: '/usr/sbin/ufw', exitCode: 0 },
    });
    const healthCheck = vi.fn(async () => true);
    const upsertNodeFn = makeFakeUpsertNode();

    const result = await provisionHost(baseConfig, {
      serverEnvPath,
      wgEasyComposeContent: 'services:\n  wg-easy:\n    image: ghcr.io/wg-easy/wg-easy:14\n',
      createSshClient: () => fakeSsh as never,
      healthCheck,
      upsertNode: upsertNodeFn,
    });

    expect(result).toEqual({ host: '203.0.113.10', country: 'Germany', status: 'provisioned' });
    expect(fakeSsh.connect).toHaveBeenCalledWith({
      host: '203.0.113.10',
      username: 'root',
      password: 'ssh-secret',
    });
    expect(fakeSsh.exec).toHaveBeenCalledWith(expect.stringContaining('docker compose'));
    expect(healthCheck).toHaveBeenCalled();
    expect(upsertNodeFn).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        country: 'Germany',
        countryCode: 'DE',
        publicEndpoint: '203.0.113.10:51820',
        wgEasyUrl: 'http://203.0.113.10:51821',
        wgEasyApiKeyRef: 'WG_KEY_DE',
      }),
    );
    expect(fakeSsh.dispose).toHaveBeenCalled();
  });

  it('installs docker when docker --version fails', async () => {
    const fakeSsh = makeFakeSsh({
      'docker --version': { stdout: '', exitCode: 127 },
      'command -v ufw': { stdout: '/usr/sbin/ufw', exitCode: 0 },
    });
    const upsertNodeFn = makeFakeUpsertNode();

    await provisionHost(baseConfig, {
      serverEnvPath,
      wgEasyComposeContent: 'services: {}',
      createSshClient: () => fakeSsh as never,
      healthCheck: vi.fn(async () => true),
      upsertNode: upsertNodeFn,
    });

    expect(fakeSsh.exec).toHaveBeenCalledWith(expect.stringContaining('get.docker.com'));
  });

  it('scopes the firewall rule to backendIp when provided', async () => {
    const fakeSsh = makeFakeSsh({
      'docker --version': { stdout: 'Docker version 27.0.0', exitCode: 0 },
      'command -v ufw': { stdout: '/usr/sbin/ufw', exitCode: 0 },
    });

    await provisionHost(baseConfig, {
      backendIp: '198.51.100.5',
      serverEnvPath,
      wgEasyComposeContent: 'services: {}',
      createSshClient: () => fakeSsh as never,
      healthCheck: vi.fn(async () => true),
      upsertNode: makeFakeUpsertNode(),
    });

    expect(fakeSsh.exec).toHaveBeenCalledWith(
      expect.stringMatching(/ufw allow from 198\.51\.100\.5.*51821/),
    );
  });

  it('opens the firewall to all sources with a warning when backendIp is omitted', async () => {
    const fakeSsh = makeFakeSsh({
      'docker --version': { stdout: 'Docker version 27.0.0', exitCode: 0 },
      'command -v ufw': { stdout: '/usr/sbin/ufw', exitCode: 0 },
    });

    await provisionHost(baseConfig, {
      serverEnvPath,
      wgEasyComposeContent: 'services: {}',
      createSshClient: () => fakeSsh as never,
      healthCheck: vi.fn(async () => true),
      upsertNode: makeFakeUpsertNode(),
    });

    expect(fakeSsh.exec).toHaveBeenCalledWith(expect.stringMatching(/ufw allow.*51821/));
  });

  it('reuses an existing panel password and does not append a duplicate env line', async () => {
    await writeFile(serverEnvPath, 'WG_KEY_DE=already-there\n');
    const fakeSsh = makeFakeSsh({
      'docker --version': { stdout: 'Docker version 27.0.0', exitCode: 0 },
      'command -v ufw': { stdout: '/usr/sbin/ufw', exitCode: 0 },
    });

    const result = await provisionHost(baseConfig, {
      serverEnvPath,
      wgEasyComposeContent: 'services: {}',
      createSshClient: () => fakeSsh as never,
      healthCheck: vi.fn(async () => true),
      upsertNode: makeFakeUpsertNode(),
    });

    expect(result.status).toBe('provisioned');
    const envContent = await import('node:fs/promises').then((fs) => fs.readFile(serverEnvPath, 'utf8'));
    expect(envContent.match(/WG_KEY_DE=/g)).toHaveLength(1);
  });

  it('returns a failed result with the error message when the health check never succeeds', async () => {
    const fakeSsh = makeFakeSsh({
      'docker --version': { stdout: 'Docker version 27.0.0', exitCode: 0 },
      'command -v ufw': { stdout: '/usr/sbin/ufw', exitCode: 0 },
    });

    const result = await provisionHost(baseConfig, {
      serverEnvPath,
      wgEasyComposeContent: 'services: {}',
      createSshClient: () => fakeSsh as never,
      healthCheck: vi.fn(async () => false),
      upsertNode: makeFakeUpsertNode(),
      healthCheckTimeoutMs: 50,
      healthCheckIntervalMs: 10,
    });

    expect(result.status).toBe('failed');
    expect(result.error).toMatch(/health check/i);
    expect(fakeSsh.dispose).toHaveBeenCalled();
  });

  it('returns a failed result and still disposes the SSH client when connect throws', async () => {
    const fakeSsh = makeFakeSsh({});
    fakeSsh.connect = vi.fn(async () => {
      throw new Error('ECONNREFUSED');
    });

    const result = await provisionHost(baseConfig, {
      serverEnvPath,
      wgEasyComposeContent: 'services: {}',
      createSshClient: () => fakeSsh as never,
      healthCheck: vi.fn(async () => true),
      upsertNode: makeFakeUpsertNode(),
    });

    expect(result.status).toBe('failed');
    expect(result.error).toContain('ECONNREFUSED');
    expect(fakeSsh.dispose).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd infra/provision && bunx vitest run _tests/provision-host.test.ts`
Expected: FAIL — `Cannot find module '../lib/provision-host'`

- [ ] **Step 3: Implement the pipeline**

Create `infra/provision/lib/provision-host.ts`:

```ts
import { appendEnvLine, hasEnvKey } from './env-file';
import type { NodeConfig } from './nodes-config';
import { hashPanelPassword, resolvePanelPassword } from './panel-password';
import { SshClient } from './ssh-client';

const REMOTE_DIR = '/opt/gnomevpn-wg-easy';
const WIREGUARD_PORT = 51820;
const PANEL_PORT = 51821;
const HEALTH_CHECK_TIMEOUT_MS = 60_000;
const HEALTH_CHECK_INTERVAL_MS = 2_000;

export type ProvisionResult = {
  host: string;
  country: string;
  status: 'provisioned' | 'updated' | 'failed';
  error?: string;
};

type WgEasyHealthCheck = (opts: { baseUrl: string; apiKey: string }) => Promise<boolean>;

type UpsertNodeFn = (
  prisma: unknown,
  input: {
    country: string;
    countryCode: string;
    flagEmoji: string;
    city?: string;
    publicEndpoint: string;
    wgEasyUrl: string;
    wgEasyApiKeyRef: string;
  },
) => Promise<{ id: string; wasExisting: boolean }>;

export type ProvisionHostOptions = {
  backendIp?: string;
  serverEnvPath: string;
  wgEasyComposeContent: string;
  createSshClient?: () => SshClient;
  healthCheck: WgEasyHealthCheck;
  upsertNode: UpsertNodeFn;
  basePrisma?: unknown;
  healthCheckTimeoutMs?: number;
  healthCheckIntervalMs?: number;
};

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const waitForHealthy = async (
  check: () => Promise<boolean>,
  timeoutMs: number,
  intervalMs: number,
): Promise<boolean> => {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (await check()) {
      return true;
    }

    await sleep(intervalMs);
  }

  return false;
};

export const provisionHost = async (
  config: NodeConfig,
  opts: ProvisionHostOptions,
): Promise<ProvisionResult> => {
  const ssh = (opts.createSshClient ?? (() => new SshClient()))();

  try {
    await ssh.connect({ host: config.host, username: config.sshUser, password: config.sshPassword });

    const dockerCheck = await ssh.exec('docker --version');

    if (dockerCheck.exitCode !== 0) {
      await ssh.exec('curl -fsSL https://get.docker.com | sh');
    }

    const { password, isNew } = await resolvePanelPassword(opts.serverEnvPath, config.countryCode);
    const passwordHash = await hashPanelPassword(password);

    await ssh.exec(`mkdir -p ${REMOTE_DIR}`);
    await ssh.putFile(opts.wgEasyComposeContent, `${REMOTE_DIR}/docker-compose.yml`);
    await ssh.putFile(
      `WG_HOST=${config.host}\nWG_EASY_PASSWORD_HASH=${passwordHash}\nWG_DEFAULT_DNS=1.1.1.1\n`,
      `${REMOTE_DIR}/.env`,
    );

    const ufwCheck = await ssh.exec('command -v ufw');

    if (ufwCheck.exitCode === 0) {
      await ssh.exec(`ufw allow ${WIREGUARD_PORT}/udp`);

      if (opts.backendIp) {
        await ssh.exec(`ufw allow from ${opts.backendIp} to any port ${PANEL_PORT} proto tcp`);
      } else {
        await ssh.exec(`ufw allow ${PANEL_PORT}/tcp`);
      }
    }

    await ssh.exec(`cd ${REMOTE_DIR} && docker compose up -d`);

    const healthy = await waitForHealthy(
      () => opts.healthCheck({ baseUrl: `http://${config.host}:${PANEL_PORT}`, apiKey: password }),
      opts.healthCheckTimeoutMs ?? HEALTH_CHECK_TIMEOUT_MS,
      opts.healthCheckIntervalMs ?? HEALTH_CHECK_INTERVAL_MS,
    );

    if (!healthy) {
      return {
        host: config.host,
        country: config.country,
        status: 'failed',
        error: 'wg-easy health check did not succeed within the timeout',
      };
    }

    if (isNew && !(await hasEnvKey(opts.serverEnvPath, `WG_KEY_${config.countryCode}`))) {
      await appendEnvLine(opts.serverEnvPath, `WG_KEY_${config.countryCode}`, password);
    }

    const upsertResult = await opts.upsertNode(opts.basePrisma, {
      country: config.country,
      countryCode: config.countryCode,
      flagEmoji: config.flagEmoji,
      city: config.city,
      publicEndpoint: `${config.host}:${WIREGUARD_PORT}`,
      wgEasyUrl: `http://${config.host}:${PANEL_PORT}`,
      wgEasyApiKeyRef: `WG_KEY_${config.countryCode}`,
    });

    return {
      host: config.host,
      country: config.country,
      status: upsertResult.wasExisting ? 'updated' : 'provisioned',
    };
  } catch (error) {
    return {
      host: config.host,
      country: config.country,
      status: 'failed',
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    ssh.dispose();
  }
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd infra/provision && bunx vitest run _tests/provision-host.test.ts`
Expected: PASS, 7 tests passing.

- [ ] **Step 5: Commit**

```bash
git add infra/provision/lib/provision-host.ts infra/provision/_tests/provision-host.test.ts
git commit -m "feat(provision): add per-host provisioning pipeline"
```

---

## Task 7: CLI entry point, wiring, and root script

**Files:**
- Create: `infra/provision/provision-nodes.ts`
- Modify: `package.json` (add `provision:nodes` script)

**Interfaces:**
- Consumes: `loadNodesConfig` (Task 1), `provisionHost` (Task 6), `upsertNode` (Task 3), `basePrisma` (existing, `apps/server/src/core`), `WgEasyClient` (existing, `apps/server/src/lib/wg-easy`).
- Produces: an executable script — no exported interface consumed by other tasks (this is the terminal entry point).

This task has no isolated unit test of its own: it is thin argument-parsing and wiring glue over already-tested units (Tasks 1–6), and its correctness is verified by the manual end-to-end run in Step 4, matching the design doc's testing strategy for the orchestration layer.

- [ ] **Step 1: Implement the CLI entry point**

Create `infra/provision/provision-nodes.ts`:

```ts
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { basePrisma } from '../../apps/server/src/core';
import { upsertNode } from '../../apps/server/scripts/lib/upsert-node';
import { WgEasyClient } from '../../apps/server/src/lib/wg-easy';
import { loadNodesConfig } from './lib/nodes-config';
import { provisionHost } from './lib/provision-host';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const NODES_CONFIG_PATH = resolve(HERE, 'nodes.json');
const WG_EASY_COMPOSE_PATH = resolve(HERE, '..', 'wg-easy', 'docker-compose.yml');
const SERVER_ENV_PATH = resolve(HERE, '..', '..', 'apps', 'server', '.env');

const parseBackendIp = (argv: string[]): string | undefined => {
  const flag = argv.find((arg) => arg.startsWith('--backend-ip='));
  return flag ? flag.slice('--backend-ip='.length) : undefined;
};

const healthCheck = async (opts: { baseUrl: string; apiKey: string }): Promise<boolean> =>
  new WgEasyClient(opts).health();

const main = async (): Promise<void> => {
  const backendIp = parseBackendIp(process.argv.slice(2));

  if (!backendIp) {
    process.stdout.write(
      'Warning: --backend-ip was not provided. The wg-easy REST port will be opened to all sources on every node.\n',
    );
  }

  const nodes = await loadNodesConfig(NODES_CONFIG_PATH);
  const wgEasyComposeContent = await readFile(WG_EASY_COMPOSE_PATH, 'utf8');

  const results = [];

  for (const node of nodes) {
    process.stdout.write(`Provisioning ${node.country} (${node.host})...\n`);

    const result = await provisionHost(node, {
      backendIp,
      serverEnvPath: SERVER_ENV_PATH,
      wgEasyComposeContent,
      healthCheck,
      upsertNode,
      basePrisma,
    });

    results.push(result);
    process.stdout.write(
      `  -> ${result.status}${result.error ? `: ${result.error}` : ''}\n`,
    );
  }

  process.stdout.write('\nSummary:\n');

  for (const result of results) {
    process.stdout.write(
      `  ${result.country.padEnd(20)} ${result.host.padEnd(16)} ${result.status}${result.error ? ` (${result.error})` : ''}\n`,
    );
  }

  await basePrisma.$disconnect();

  const anyFailed = results.some((result) => result.status === 'failed');
  process.exitCode = anyFailed ? 1 : 0;
};

void main();
```

- [ ] **Step 2: Add the root package.json script**

Read `package.json` first. Add to the `scripts` block:

```json
"provision:nodes": "bun --env-file apps/server/.env infra/provision/provision-nodes.ts"
```

The `--env-file apps/server/.env` flag matters: `provisionHost`'s `resolvePanelPassword` step reads and writes that same file directly by path (not via `process.env`), so this flag is not strictly required for password resolution — but `basePrisma` (imported transitively) validates `DATABASE_URL` and other env vars from `process.env` at module load time (see `apps/server/src/core/base-prisma.ts`), so the server's `.env` must be loaded into the process for the script to even start.

- [ ] **Step 3: Verify the full test suite still passes**

Run (from repo root): `bun run typecheck`
Expected: exit code 0 for all three packages.

Run: `cd infra/provision && bunx vitest run`
Expected: PASS, all tests from Tasks 1, 2, 4, 5, 6 passing (29 tests total: 4+10+3+5+7... — run and confirm actual count from output).

Run: `cd apps/server && bun run test`
Expected: PASS, 19 tests (16 original + 3 from Task 3).

Run (from repo root): `bunx biome check infra/provision apps/server/scripts`
Expected: clean; if not, run `bunx biome check --write infra/provision apps/server/scripts` and re-check.

- [ ] **Step 4: Manual end-to-end verification against a real VPS**

This step cannot be automated — it is the same kind of manual verification this repo already relied on for Stage 1's Task 18 E2E test.

1. Copy `infra/provision/nodes.example.json` to `infra/provision/nodes.json` and fill in one real VPS (host, root SSH password, country metadata).
2. Run: `bun run provision:nodes` (optionally with `--backend-ip=<your known backend IP>` if you have one).
3. Confirm the summary line shows `provisioned` for the host.
4. Confirm `apps/server/.env` now has a `WG_KEY_<CODE>=...` line.
5. Confirm the `Node` row exists: `docker exec gnomevpn-postgres-dev psql -U gnomevpn -d gnomevpn -c "select country, public_endpoint, wg_easy_url, wg_easy_api_key_ref from node;"` (adjust container name if your local Postgres container differs — see `docker-compose.dev.yml`).
6. Run `bun run provision:nodes` again with the same `nodes.json` — confirm it exits 0, the summary shows `updated` (not `provisioned`), and `apps/server/.env` still has exactly one `WG_KEY_<CODE>` line (not duplicated).
7. From the backend host (or wherever `apps/server` runs), confirm the full connect/disconnect flow works against this newly provisioned node — same manual E2E steps as Stage 1's Task 18 (sign up, `GET /nodes`, `POST /tunnel/connect`, verify the returned `TunnelConfig`, `POST /tunnel/disconnect`).

If any of these steps fail, fix the root cause in the relevant task's file (not by patching around it in this step) and re-run from Step 3.

- [ ] **Step 5: Commit**

```bash
git add package.json infra/provision/provision-nodes.ts
git commit -m "feat(provision): add CLI entry point wiring the provisioning pipeline"
```

---

## Self-Review Notes

**Spec coverage check against the design doc:**
- JSON input with Zod validation, reject-whole-file-on-any-invalid-entry → Task 1. ✓
- `sshPassword` gitignored, example file committed → Task 1 (gitignore added before any file lands in the directory). ✓
- Docker ensure-or-install → Task 6, `provisionHost`. ✓
- Compose stack shipped via SFTP to fixed remote path → Task 6. ✓
- Password resolution (reuse-if-exists, generate-if-not) with bcrypt hash + `$`-doubling → Task 5, wired into Task 6. ✓
- Firewall: `51820/udp` open, `51821/tcp` scoped to `--backend-ip` or open-with-warning → Task 6 + Task 7 (the warning is printed in Task 7's `main()`, the actual `ufw` command is in Task 6). ✓
- Health check via the real wg-easy contract → Task 6 delegates to the existing `WgEasyClient.health()`, wired in Task 7. ✓
- `.env` append is idempotent-by-key, never overwrites → Task 2 (`appendEnvLine` throws on existing key) + Task 6 (checks `hasEnvKey` before appending, only when the password was newly generated). ✓
- Node upsert reuses `seed-node.ts`'s exact idempotency guarantee → Task 3 (extraction) + Task 6 (usage). ✓
- Per-host result table + non-zero exit on any failure → Task 7. ✓
- Per-host isolation (one host's failure doesn't abort the batch) → Task 6's try/catch converts any thrown error into a `failed` result rather than propagating; Task 7's loop has no early-exit. ✓
- Testing strategy (unit-test pure pieces, manual verification for SSH/Docker/HTTP orchestration) → followed exactly: Tasks 1, 2, 3, 5 are pure-logic unit tests against fakes/temp files; Task 4 mocks `node-ssh` itself (no real network); Task 6 unit-tests the pipeline's *sequencing and content* against a fake `SshClient`+`healthCheck`+`upsertNode`, never touching real SSH; Task 7 is verified manually per the design doc's own acknowledgment that orchestration isn't unit-tested. ✓
- Open question (`--backend-ip` persistence) → resolved as "re-pass each time, no persistence" per the design doc's stated leaning; Task 7 implements it as a plain CLI flag with no dotfile memory. This plan does not revisit that decision.

**Placeholder scan:** No "TBD"/"TODO"/"similar to Task N" found. Every code step contains complete, runnable code.

**Type consistency check:**
- `NodeConfig` (Task 1) fields — `host, sshUser, sshPassword, country, countryCode, flagEmoji, city?` — match exactly what Task 6's `provisionHost` destructures from `config` and what Task 7's `provisionHost` call site passes through unchanged (it iterates `nodes: NodeConfig[]` directly).
- `UpsertNodeInput` (Task 3) fields — `country, countryCode, flagEmoji, city?, publicEndpoint, wgEasyUrl, wgEasyApiKeyRef` — match exactly what Task 6 constructs and passes to `opts.upsertNode(...)`.
- `ProvisionResult` (Task 6) — `{ host, country, status, error? }` — matches what Task 7's summary-printing loop reads (`result.status`, `result.error`, `result.country`, `result.host`).
- `SshClient`'s `exec` return shape `{ stdout, stderr, exitCode }` (Task 4) matches what Task 6's `dockerCheck.exitCode` and `ufwCheck.exitCode` checks expect.
- `resolvePanelPassword`'s return shape `{ password, isNew }` (Task 5) matches Task 6's destructuring `const { password, isNew } = await resolvePanelPassword(...)`.

No mismatches found.
