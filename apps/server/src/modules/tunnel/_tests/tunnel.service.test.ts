import { describe, expect, it, vi } from 'vitest';

import { AppServiceUnavailableException } from '../../../common/exceptions';
import { TunnelService } from '../tunnel.service';

const node = {
  id: 'n1',
  publicEndpoint: 'de:51820',
  wgEasyUrl: 'http://wg',
  wgEasyApiKeyRef: 'WG_KEY',
};

const makeDeps = (existingPeer: unknown) => {
  const deleteClient = vi.fn(async () => {});
  const createClient = vi.fn(async () => ({
    clientId: 'c1',
    privateKey: 'priv',
    address: '10.8.0.2/32',
    serverPublicKey: 'srvpub',
    dns: '10.8.0.1',
  }));

  const fakePrisma = {
    activePeer: {
      findUnique: vi.fn(async () => existingPeer),
      delete: vi.fn(async () => {}),
      upsert: vi.fn(async () => ({})),
      create: vi.fn(async () => ({})),
    },
    node: {
      findUnique: vi.fn(async () => ({
        wgEasyUrl: node.wgEasyUrl,
        wgEasyApiKeyRef: node.wgEasyApiKeyRef,
      })),
    },
  };

  const prisma = fakePrisma as never;
  const nodes = { getNodeForConnect: vi.fn(async () => node) } as never;

  return { prisma, fakePrisma, nodes, createClient, deleteClient };
};

describe('TunnelService.connect', () => {
  it('creates a peer and returns a tunnel config', async () => {
    process.env.WG_KEY = 'secret';
    const { prisma, fakePrisma, nodes, createClient, deleteClient } = makeDeps(null);
    const service = new TunnelService(prisma, nodes);
    service.makeWgClient = () => ({ createClient, deleteClient }) as never;

    const cfg = await service.connect('user-1', 'n1');

    expect(cfg.endpoint).toBe('de:51820');
    expect(cfg.privateKey).toBe('priv');
    expect(cfg.allowedIps).toContain('0.0.0.0/0');
    expect(createClient).toHaveBeenCalled();
    expect(fakePrisma.activePeer.upsert).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      create: {
        userId: 'user-1',
        nodeId: 'n1',
        wgEasyClientId: 'c1',
        assignedIp: '10.8.0.2/32',
      },
      update: {
        nodeId: 'n1',
        wgEasyClientId: 'c1',
        assignedIp: '10.8.0.2/32',
      },
    });
  });

  it('creates the new peer before removing the existing one', async () => {
    process.env.WG_KEY = 'secret';
    const existing = { wgEasyClientId: 'old', nodeId: 'n0' };
    const { prisma, fakePrisma, nodes, createClient, deleteClient } = makeDeps(existing);
    const service = new TunnelService(prisma, nodes);
    service.makeWgClient = () => ({ createClient, deleteClient }) as never;

    const calls: string[] = [];
    createClient.mockImplementation(async () => {
      calls.push('createClient');
      return {
        clientId: 'c1',
        privateKey: 'priv',
        address: '10.8.0.2/32',
        serverPublicKey: 'srvpub',
        dns: '10.8.0.1',
      };
    });
    deleteClient.mockImplementation(async () => {
      calls.push('deleteClient');
    });

    await service.connect('user-1', 'n1');

    expect(deleteClient).toHaveBeenCalledWith('old');
    expect(calls).toEqual(['createClient', 'deleteClient']);
    expect(fakePrisma.activePeer.delete).not.toHaveBeenCalled();
    expect(fakePrisma.activePeer.upsert).toHaveBeenCalled();
  });

  it('throws NODE_UNAVAILABLE when createClient fails without mutating state', async () => {
    process.env.WG_KEY = 'secret';
    const { prisma, fakePrisma, nodes, deleteClient } = makeDeps(null);
    const createClient = vi.fn(async () => {
      throw new Error('connection refused');
    });
    const service = new TunnelService(prisma, nodes);
    service.makeWgClient = () => ({ createClient, deleteClient }) as never;

    await expect(service.connect('user-1', 'n1')).rejects.toBeInstanceOf(
      AppServiceUnavailableException,
    );
    expect(fakePrisma.activePeer.upsert).not.toHaveBeenCalled();
    expect(fakePrisma.activePeer.delete).not.toHaveBeenCalled();
    expect(deleteClient).not.toHaveBeenCalled();
  });

  it('deletes the newly created wg-easy peer when the DB upsert fails', async () => {
    process.env.WG_KEY = 'secret';
    const { prisma, fakePrisma, nodes, createClient, deleteClient } = makeDeps(null);
    fakePrisma.activePeer.upsert.mockImplementation(async () => {
      throw new Error('P2002');
    });
    const service = new TunnelService(prisma, nodes);
    service.makeWgClient = () => ({ createClient, deleteClient }) as never;

    await expect(service.connect('user-1', 'n1')).rejects.toThrow('P2002');
    expect(deleteClient).toHaveBeenCalledWith('c1');
  });
});
