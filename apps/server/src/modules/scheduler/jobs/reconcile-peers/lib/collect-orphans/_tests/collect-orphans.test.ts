import { describe, expect, it, vi } from 'vitest';

import type { PrismaService } from '../../../../../../../core';
import type { XrayClient } from '../../../../../../../lib';
import type { ReconcilePeer } from '../../../reconcile-peers.job.types';

import { peerClientName } from '../../../../../../peers';
import { collectOrphans } from '../collect-orphans';

const OWNER = 'nZTp8U6AtElvrC60yGPq6GBfwLL9kxbX';
const STRANGER = 'wwlEUEx5LASlRRfUKoKpa14X1iaChDVV';

const peer = (overrides: Partial<ReconcilePeer> = {}): ReconcilePeer => ({
  id: 'peer-1',
  userId: OWNER,
  kind: 'config',
  name: 'incy',
  nodeId: 'node-1',
  protocol: 'hysteria2',
  state: 'active',
  nodeCredential: 'secret',
  ...overrides
});

const prismaWith = (livingIds: string[]) =>
  ({ user: { findMany: vi.fn().mockResolvedValue(livingIds.map((id) => ({ id }))) } }) as unknown as PrismaService;

const orphanEmail = peerClientName({ userId: STRANGER, kind: 'config', name: 'incy', nodeId: 'node-1', protocol: 'hysteria2' });

describe('collectOrphans', () => {
  it('refuses to delete anything when the node would not say who is online', async () => {
    const deleteClient = vi.fn();

    const collected = await collectOrphans({
      prisma: prismaWith([]),
      xray: { deleteClient } as unknown as XrayClient,
      peers: [],
      nodeClients: new Map([[orphanEmail, true]]),
      online: null
    });

    expect(collected).toBe(false);
    expect(deleteClient).not.toHaveBeenCalled();
  });

  it('deletes a client whose owner is gone from the database', async () => {
    const deleteClient = vi.fn();

    const collected = await collectOrphans({
      prisma: prismaWith([]),
      xray: { deleteClient } as unknown as XrayClient,
      peers: [],
      nodeClients: new Map([[orphanEmail, true]]),
      online: new Set()
    });

    expect(collected).toBe(true);
    expect(deleteClient).toHaveBeenCalledWith(orphanEmail);
  });

  it('spares a client that is carrying traffic right now, whatever the database says', async () => {
    const deleteClient = vi.fn();

    const collected = await collectOrphans({
      prisma: prismaWith([]),
      xray: { deleteClient } as unknown as XrayClient,
      peers: [],
      nodeClients: new Map([[orphanEmail, true]]),
      online: new Set([orphanEmail])
    });

    expect(collected).toBe(false);
    expect(deleteClient).not.toHaveBeenCalled();
  });

  it('spares a client whose owner still exists, even with no peer row for it', async () => {
    const deleteClient = vi.fn();

    const collected = await collectOrphans({
      prisma: prismaWith([STRANGER]),
      xray: { deleteClient } as unknown as XrayClient,
      peers: [],
      nodeClients: new Map([[orphanEmail, true]]),
      online: new Set()
    });

    expect(collected).toBe(false);
    expect(deleteClient).not.toHaveBeenCalled();
  });

  it('spares a peer this node is supposed to have', async () => {
    const deleteClient = vi.fn();
    const mine = peer();

    const collected = await collectOrphans({
      prisma: prismaWith([]),
      xray: { deleteClient } as unknown as XrayClient,
      peers: [mine],
      nodeClients: new Map([[peerClientName(mine), true]]),
      online: new Set()
    });

    expect(collected).toBe(false);
    expect(deleteClient).not.toHaveBeenCalled();
  });

  it('leaves a client this server never named alone', async () => {
    const deleteClient = vi.fn();

    const collected = await collectOrphans({
      prisma: prismaWith([]),
      xray: { deleteClient } as unknown as XrayClient,
      peers: [],
      nodeClients: new Map([['someone-elses-client', true]]),
      online: new Set()
    });

    expect(collected).toBe(false);
    expect(deleteClient).not.toHaveBeenCalled();
  });
});
