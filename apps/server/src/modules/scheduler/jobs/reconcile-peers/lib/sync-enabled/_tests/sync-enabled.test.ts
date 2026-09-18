import { describe, expect, it, vi } from 'vitest';

import type { XrayClient } from '../../../../../../../lib';
import type { ReconcilePeer } from '../../../reconcile-peers.job.types';

import { peerClientName } from '../../../../../../peers';
import { syncEnabled } from '../sync-enabled';

const peer = (overrides: Partial<ReconcilePeer> = {}): ReconcilePeer => ({
  id: 'peer-1',
  userId: 'nZTp8U6AtElvrC60yGPq6GBfwLL9kxbX',
  kind: 'config',
  name: 'incy',
  nodeId: 'node-1',
  protocol: 'hysteria2',
  state: 'active',
  nodeCredential: 'secret',
  ...overrides
});

const xrayFor = (setClientsEnabled = vi.fn()) => ({ setClientsEnabled }) as unknown as XrayClient;

describe('syncEnabled', () => {
  it('leaves the node alone when every peer already matches', async () => {
    const setClientsEnabled = vi.fn();
    const active = peer();

    const changed = await syncEnabled({
      xray: xrayFor(setClientsEnabled),
      peers: [active],
      nodeClients: new Map([[peerClientName(active), true]])
    });

    expect(changed).toBe(false);
    expect(setClientsEnabled).not.toHaveBeenCalled();
  });

  it('enables a peer the node is still holding disabled', async () => {
    const setClientsEnabled = vi.fn();
    const active = peer();
    const email = peerClientName(active);

    const changed = await syncEnabled({
      xray: xrayFor(setClientsEnabled),
      peers: [active],
      nodeClients: new Map([[email, false]])
    });

    expect(changed).toBe(true);
    expect(setClientsEnabled).toHaveBeenCalledWith({ emails: [email], enabled: true });
  });

  it('disables a peer whose subscription lapsed', async () => {
    const setClientsEnabled = vi.fn();
    const lapsed = peer({ state: 'disabled' });
    const email = peerClientName(lapsed);

    const changed = await syncEnabled({
      xray: xrayFor(setClientsEnabled),
      peers: [lapsed],
      nodeClients: new Map([[email, true]])
    });

    expect(changed).toBe(true);
    expect(setClientsEnabled).toHaveBeenCalledWith({ emails: [email], enabled: false });
  });

  it('skips a peer the node has never heard of, leaving it to restoreMissing', async () => {
    const setClientsEnabled = vi.fn();

    const changed = await syncEnabled({
      xray: xrayFor(setClientsEnabled),
      peers: [peer()],
      nodeClients: new Map()
    });

    expect(changed).toBe(false);
    expect(setClientsEnabled).not.toHaveBeenCalled();
  });
});
