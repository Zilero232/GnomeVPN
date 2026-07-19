import { afterEach, describe, expect, it, vi } from 'vitest';

import { PeerGcJob } from '../peer-gc.job';

const STALE_MS = 15 * 60_000;

const makePeer = (over: Record<string, unknown> = {}) => ({
  id: 'peer-1',
  wgEasyClientId: 'client-1',
  createdAt: new Date(Date.now() - STALE_MS - 60_000),
  node: { wgEasyUrl: 'http://node.test:51821', wgEasyApiKeyRef: 'WG_KEY_TEST' },
  ...over,
});

const makePrisma = (peers: unknown[]) => ({
  activePeer: {
    findMany: vi.fn(async () => peers),
    delete: vi.fn(async () => ({ id: 'peer-1' })),
  },
});

afterEach(() => {
  process.env.WG_KEY_TEST = undefined;
});

describe('PeerGcJob', () => {
  it('снимает пир без хендшейка старше порога', async () => {
    process.env.WG_KEY_TEST = 'secret';
    const prisma = makePrisma([makePeer()]);
    const deleteClient = vi.fn(async () => undefined);

    const job = new PeerGcJob(prisma as never);
    job.makeClient = () => ({ deleteClient, getClientHandshake: async () => null }) as never;

    await job.run();

    expect(deleteClient).toHaveBeenCalledWith('client-1');
    expect(prisma.activePeer.delete).toHaveBeenCalledWith({ where: { id: 'peer-1' } });
  });

  it('не трогает свежий пир, ещё не сделавший хендшейк', async () => {
    process.env.WG_KEY_TEST = 'secret';
    const prisma = makePrisma([makePeer({ createdAt: new Date() })]);
    const deleteClient = vi.fn(async () => undefined);

    const job = new PeerGcJob(prisma as never);
    job.makeClient = () => ({ deleteClient, getClientHandshake: async () => null }) as never;

    await job.run();

    expect(deleteClient).not.toHaveBeenCalled();
    expect(prisma.activePeer.delete).not.toHaveBeenCalled();
  });

  it('не трогает пир со свежим хендшейком', async () => {
    process.env.WG_KEY_TEST = 'secret';
    const prisma = makePrisma([makePeer()]);
    const deleteClient = vi.fn(async () => undefined);

    const job = new PeerGcJob(prisma as never);
    job.makeClient = () => ({ deleteClient, getClientHandshake: async () => new Date() }) as never;

    await job.run();

    expect(deleteClient).not.toHaveBeenCalled();
  });

  it('снимает пир со старым хендшейком', async () => {
    process.env.WG_KEY_TEST = 'secret';
    const prisma = makePrisma([makePeer({ createdAt: new Date() })]);
    const deleteClient = vi.fn(async () => undefined);

    const job = new PeerGcJob(prisma as never);
    job.makeClient = () =>
      ({
        deleteClient,
        getClientHandshake: async () => new Date(Date.now() - STALE_MS - 60_000),
      }) as never;

    await job.run();

    expect(deleteClient).toHaveBeenCalledWith('client-1');
  });

  it('пропускает узел без ключа в окружении', async () => {
    process.env.WG_KEY_TEST = '';
    const prisma = makePrisma([makePeer()]);
    const deleteClient = vi.fn(async () => undefined);

    const job = new PeerGcJob(prisma as never);
    job.makeClient = () => ({ deleteClient, getClientHandshake: async () => null }) as never;

    await job.run();

    expect(deleteClient).not.toHaveBeenCalled();
  });
});
