import { describe, expect, it, vi } from 'vitest';

import type { PrismaService } from '../../../../../../../core';
import type { XrayClient } from '../../../../../../../lib';
import type { ReconcilePeer } from '../../../reconcile-peers.job.types';

import { peerClientName } from '../../../../../../peers';
import { releaseRevoked } from '../release-revoked';

const peer = (overrides: Partial<ReconcilePeer> = {}): ReconcilePeer => ({
  id: 'peer-1',
  deviceId: null,
  revokedAt: null,
  userId: 'nZTp8U6AtElvrC60yGPq6GBfwLL9kxbX',
  kind: 'config',
  name: 'd-3f2a9c1e7b44',
  nodeId: 'node-1',
  protocol: 'hysteria2',
  state: 'disabled',
  nodeCredential: 'secret',
  user: { subscription: null },
  ...overrides
});

const prismaWith = (deleteMany = vi.fn().mockResolvedValue({ count: 1 })) => ({ peer: { deleteMany } }) as unknown as PrismaService;

describe('releaseRevoked', () => {
  it('leaves the node and the rows alone when nothing is revoked', async () => {
    const deleteClient = vi.fn();
    const deleteMany = vi.fn();

    const released = await releaseRevoked({
      prisma: prismaWith(deleteMany),
      xray: { deleteClient } as unknown as XrayClient,
      peers: [peer()],
      nodeClients: new Map([[peerClientName(peer()), true]])
    });

    expect(released).toBe(false);
    expect(deleteClient).not.toHaveBeenCalled();
    expect(deleteMany).not.toHaveBeenCalled();
  });

  it('deletes a revoked client from the node, then its row', async () => {
    const revoked = peer({ revokedAt: new Date() });
    const email = peerClientName(revoked);
    const deleteClient = vi.fn().mockResolvedValue(undefined);
    const deleteMany = vi.fn().mockResolvedValue({ count: 1 });
    const nodeClients = new Map([[email, false]]);

    const released = await releaseRevoked({
      prisma: prismaWith(deleteMany),
      xray: { deleteClient } as unknown as XrayClient,
      peers: [revoked],
      nodeClients
    });

    expect(released).toBe(true);
    expect(deleteClient).toHaveBeenCalledWith(email);
    expect(nodeClients.has(email)).toBe(false);
    expect(deleteMany).toHaveBeenCalledWith({ where: { id: { in: ['peer-1'] }, revokedAt: { not: null } } });
  });

  it('forgets a revoked row whose client the node no longer holds, without asking for a restart', async () => {
    const deleteClient = vi.fn();
    const deleteMany = vi.fn().mockResolvedValue({ count: 1 });

    const released = await releaseRevoked({
      prisma: prismaWith(deleteMany),
      xray: { deleteClient } as unknown as XrayClient,
      peers: [peer({ revokedAt: new Date() })],
      nodeClients: new Map()
    });

    expect(released).toBe(false);
    expect(deleteClient).not.toHaveBeenCalled();
    expect(deleteMany).toHaveBeenCalledTimes(1);
  });

  it('keeps the rows when the node refuses, so the next pass tries again', async () => {
    const revoked = peer({ revokedAt: new Date() });
    const deleteMany = vi.fn();

    await expect(
      releaseRevoked({
        prisma: prismaWith(deleteMany),
        xray: { deleteClient: vi.fn().mockRejectedValue(new Error('node down')) } as unknown as XrayClient,
        peers: [revoked],
        nodeClients: new Map([[peerClientName(revoked), true]])
      })
    ).rejects.toThrow('node down');

    expect(deleteMany).not.toHaveBeenCalled();
  });
});
