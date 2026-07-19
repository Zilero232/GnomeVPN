import { afterEach, describe, expect, it, vi } from 'vitest';

import { PeerGcJob } from '../peer-gc.job';

const STALE_MS = 5 * 60_000;

const makePeer = (over: Record<string, unknown> = {}) => ({
  id: 'peer-1',
  userId: 'user-1',
  wgEasyClientId: 'client-1',
  createdAt: new Date(Date.now() - STALE_MS - 60_000),
  lastHandshakeAt: null,
  node: { wgEasyUrl: 'http://node.test:51821', wgEasyApiKeyRef: 'WG_KEY_TEST' },
  ...over,
});

const makePrisma = (peers: unknown[]) => ({
  activePeer: {
    findMany: vi.fn(async () => peers),
    delete: vi.fn(async () => ({ id: 'peer-1' })),
    update: vi.fn(async () => ({ id: 'peer-1' })),
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
  });

  it('сохраняет свежий хендшейк в базу, чтобы не ходить в узел каждый раз', async () => {
    process.env.WG_KEY_TEST = 'secret';
    const handshake = new Date();
    const prisma = makePrisma([makePeer()]);

    const job = new PeerGcJob(prisma as never);
    job.makeClient = () =>
      ({ deleteClient: vi.fn(), getClientHandshake: async () => handshake }) as never;

    await job.run();

    expect(prisma.activePeer.update).toHaveBeenCalledWith({
      where: { id: 'peer-1' },
      data: { lastHandshakeAt: handshake },
    });
  });

  it('снимает пир, который давно не делал хендшейк — ПК выключили', async () => {
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

  it('не роняет проход, когда один узел недоступен', async () => {
    process.env.WG_KEY_TEST = 'secret';
    const prisma = makePrisma([makePeer({ id: 'bad' }), makePeer({ id: 'good' })]);

    const job = new PeerGcJob(prisma as never);
    job.makeClient = () =>
      ({
        deleteClient: vi.fn(),
        getClientHandshake: async () => {
          throw new Error('unreachable');
        },
      }) as never;

    await expect(job.run()).resolves.toBeUndefined();
  });

  it('обрабатывает пиры параллельно', async () => {
    process.env.WG_KEY_TEST = 'secret';
    const peers = Array.from({ length: 4 }, (_, i) => makePeer({ id: `peer-${i}` }));
    const prisma = makePrisma(peers);

    let running = 0;
    let peak = 0;

    const job = new PeerGcJob(prisma as never);
    job.makeClient = () =>
      ({
        deleteClient: vi.fn(),
        getClientHandshake: async () => {
          running += 1;
          peak = Math.max(peak, running);
          await new Promise((resolve) => setTimeout(resolve, 10));
          running -= 1;

          return null;
        },
      }) as never;

    await job.run();

    expect(peak).toBeGreaterThan(1);
  });
});
