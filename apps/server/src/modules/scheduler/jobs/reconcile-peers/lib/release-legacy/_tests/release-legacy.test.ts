import { describe, expect, it, vi } from 'vitest';

import type { PrismaService } from '../../../../../../../core';
import type { XrayClient } from '../../../../../../../lib';
import type { ReconcilePeer } from '../../../reconcile-peers.job.types';

import { peerClientName } from '../../../../../../peers';
import { releaseLegacy } from '../release-legacy';

const OWNER = 'nZTp8U6AtElvrC60yGPq6GBfwLL9kxbX';
const NOW = new Date('2026-10-11T04:17:00.000Z');

const peer = (overrides: Partial<ReconcilePeer> = {}): ReconcilePeer => ({
  id: 'legacy-1',
  deviceId: null,
  revokedAt: null,
  userId: OWNER,
  kind: 'config',
  name: 'incy',
  nodeId: 'node-1',
  protocol: 'hysteria2',
  state: 'active',
  nodeCredential: 'shared',
  user: { subscription: null },
  ...overrides
});

const prismaWith = ({ settled = [{ userId: OWNER }], deleteMany = vi.fn().mockResolvedValue({ count: 1 }) } = {}) =>
  ({ device: { findMany: vi.fn().mockResolvedValue(settled) }, peer: { deleteMany } }) as unknown as PrismaService;

describe('releaseLegacy', () => {
  it('does nothing outside the weekly pass, when nobody is known to be online or offline', async () => {
    const deleteClient = vi.fn();

    const retired = await releaseLegacy({
      prisma: prismaWith(),
      xray: { deleteClient } as unknown as XrayClient,
      peers: [peer()],
      nodeClients: new Map([[peerClientName(peer()), true]]),
      online: null,
      now: NOW
    });

    expect(retired).toEqual([]);
    expect(deleteClient).not.toHaveBeenCalled();
  });

  it('retires an idle shared peer once the account has a settled device', async () => {
    const shared = peer();
    const email = peerClientName(shared);
    const deleteClient = vi.fn().mockResolvedValue(undefined);
    const deleteMany = vi.fn().mockResolvedValue({ count: 1 });
    const nodeClients = new Map([[email, true]]);

    const retired = await releaseLegacy({
      prisma: prismaWith({ deleteMany }),
      xray: { deleteClient } as unknown as XrayClient,
      peers: [shared],
      nodeClients,
      online: new Set(),
      now: NOW
    });

    expect(retired.map((peer) => peer.id)).toEqual(['legacy-1']);
    expect(deleteClient).toHaveBeenCalledWith(email);
    expect(nodeClients.has(email)).toBe(false);
    expect(deleteMany).toHaveBeenCalledWith({ where: { id: { in: ['legacy-1'] } } });
  });

  it('leaves a shared peer that is carrying a session right now for next week', async () => {
    const shared = peer();
    const deleteClient = vi.fn();

    const retired = await releaseLegacy({
      prisma: prismaWith(),
      xray: { deleteClient } as unknown as XrayClient,
      peers: [shared],
      nodeClients: new Map([[peerClientName(shared), true]]),
      online: new Set([peerClientName(shared)]),
      now: NOW
    });

    expect(retired).toEqual([]);
    expect(deleteClient).not.toHaveBeenCalled();
  });

  it('keeps the shared peer of an account whose devices have not settled yet', async () => {
    const deleteClient = vi.fn();

    const retired = await releaseLegacy({
      prisma: prismaWith({ settled: [] }),
      xray: { deleteClient } as unknown as XrayClient,
      peers: [peer()],
      nodeClients: new Map([[peerClientName(peer()), true]]),
      online: new Set(),
      now: NOW
    });

    expect(retired).toEqual([]);
    expect(deleteClient).not.toHaveBeenCalled();
  });

  it('never touches a device peer', async () => {
    const devicePeer = peer({ id: 'device-1', name: 'd-3f2a9c1e7b44', deviceId: 'device-id' });
    const deleteClient = vi.fn();

    const retired = await releaseLegacy({
      prisma: prismaWith(),
      xray: { deleteClient } as unknown as XrayClient,
      peers: [devicePeer],
      nodeClients: new Map([[peerClientName(devicePeer), true]]),
      online: new Set(),
      now: NOW
    });

    expect(retired).toEqual([]);
    expect(deleteClient).not.toHaveBeenCalled();
  });
});
