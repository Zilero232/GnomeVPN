import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { compare } from 'bcryptjs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { hashPanelPassword, resolvePanelPassword } from '../panel-password';

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
