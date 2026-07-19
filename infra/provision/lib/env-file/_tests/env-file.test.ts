import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { appendEnvLine, hasEnvKey, readEnvValue } from '../env-file';

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
