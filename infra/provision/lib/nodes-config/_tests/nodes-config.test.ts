import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { loadNodesConfig } from '../nodes-config';

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
        {
          host: '',
          sshUser: 'root',
          sshPassword: 'x',
          country: 'A',
          countryCode: 'AA',
          flagEmoji: '🏳️',
        },
        {
          host: '203.0.113.11',
          sshUser: '',
          sshPassword: 'x',
          country: 'B',
          countryCode: 'BB',
          flagEmoji: '🏳️',
        },
      ]),
    );

    await expect(loadNodesConfig(filePath)).rejects.toThrow(/index 0/);
    await expect(loadNodesConfig(filePath)).rejects.toThrow(/index 1/);
  });

  it('throws a clear error when the file does not exist', async () => {
    await expect(loadNodesConfig(join(dir, 'missing.json'))).rejects.toThrow();
  });
});
