import { Logger } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import type { XrayClient } from '../../../../../../../lib';
import type { ReconcileNode, ReconcilePeer } from '../../../reconcile-peers.job.types';

import { peerClientName } from '../../../../../../peers';
import { restoreMissing } from '../restore-missing';

const NODE: ReconcileNode = { id: 'node-1', apiUrl: 'http://node', apiTokenEnvVar: 'XRAY_KEY_X' };

const peer = (overrides: Partial<ReconcilePeer> = {}): ReconcilePeer => ({
  id: 'peer-1',
  userId: 'nZTp8U6AtElvrC60yGPq6GBfwLL9kxbX',
  kind: 'config',
  name: 'incy',
  nodeId: NODE.id,
  protocol: 'hysteria2',
  state: 'active',
  nodeCredential: 'the-stored-secret',
  ...overrides
});

const silentLogger = () => ({ log: vi.fn(), warn: vi.fn() }) as unknown as Logger;

describe('restoreMissing', () => {
  it('does nothing when the node already holds every peer', async () => {
    const createClient = vi.fn();
    const present = peer();

    const restored = await restoreMissing({
      logger: silentLogger(),
      xray: { createClient } as unknown as XrayClient,
      node: NODE,
      peers: [present],
      nodeClients: new Map([[peerClientName(present), true]])
    });

    expect(restored).toBe(false);
    expect(createClient).not.toHaveBeenCalled();
  });

  it('reissues a missing peer with the credential already in the database', async () => {
    const createClient = vi.fn();
    const missing = peer();

    const restored = await restoreMissing({
      logger: silentLogger(),
      xray: { createClient } as unknown as XrayClient,
      node: NODE,
      peers: [missing],
      nodeClients: new Map()
    });

    expect(restored).toBe(true);

    expect(createClient).toHaveBeenCalledWith({
      email: peerClientName(missing),
      auth: missing.nodeCredential,
      deferRestart: true
    });
  });

  it('routes a vless peer to the vless client, so the credential lands as an id', async () => {
    const createVlessClient = vi.fn();
    const missing = peer({ protocol: 'vless' });

    await restoreMissing({
      logger: silentLogger(),
      xray: { createVlessClient } as unknown as XrayClient,
      node: NODE,
      peers: [missing],
      nodeClients: new Map()
    });

    expect(createVlessClient).toHaveBeenCalledWith({
      email: peerClientName(missing),
      id: missing.nodeCredential,
      deferRestart: true
    });
  });

  it('records what it restored, so a second pass finds nothing to do', async () => {
    const missing = peer();
    const nodeClients = new Map<string, boolean>();

    await restoreMissing({
      logger: silentLogger(),
      xray: { createClient: vi.fn() } as unknown as XrayClient,
      node: NODE,
      peers: [missing],
      nodeClients
    });

    expect(nodeClients.get(peerClientName(missing))).toBe(true);
  });

  it('reports no change when every reissue fails, so the core is not restarted for nothing', async () => {
    const createClient = vi.fn().mockRejectedValue(new Error('panel refused'));

    const restored = await restoreMissing({
      logger: silentLogger(),
      xray: { createClient } as unknown as XrayClient,
      node: NODE,
      peers: [peer()],
      nodeClients: new Map()
    });

    expect(restored).toBe(false);
  });
});
