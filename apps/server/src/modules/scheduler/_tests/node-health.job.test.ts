import { afterEach, describe, expect, it, vi } from 'vitest';

import { NodeHealthJob } from '../node-health.job';

const makeNode = (over: Record<string, unknown> = {}) => ({
  id: 'node-1',
  wgEasyUrl: 'http://node.test:51821',
  wgEasyApiKeyRef: 'WG_KEY_TEST',
  ...over,
});

const makePrisma = (nodes: unknown[]) => ({
  node: {
    findMany: vi.fn(async () => nodes),
    update: vi.fn(async () => ({ id: 'node-1' })),
  },
});

afterEach(() => {
  process.env.WG_KEY_TEST = undefined;
});

describe('NodeHealthJob', () => {
  it('обновляет lastHealthyAt, когда панель отвечает', async () => {
    process.env.WG_KEY_TEST = 'secret';
    const prisma = makePrisma([makeNode()]);

    const job = new NodeHealthJob(prisma as never);
    job.makeClient = () => ({ health: async () => true }) as never;

    await job.run();

    const [args] = prisma.node.update.mock.calls[0] as unknown as [
      { where: { id: string }; data: { lastHealthyAt: Date } },
    ];

    expect(args.where.id).toBe('node-1');
    expect(args.data.lastHealthyAt).toBeInstanceOf(Date);
  });

  it('не трогает lastHealthyAt, когда панель молчит', async () => {
    process.env.WG_KEY_TEST = 'secret';
    const prisma = makePrisma([makeNode()]);

    const job = new NodeHealthJob(prisma as never);
    job.makeClient = () => ({ health: async () => false }) as never;

    await job.run();

    expect(prisma.node.update).not.toHaveBeenCalled();
  });

  it('пропускает узел без ключа в окружении', async () => {
    process.env.WG_KEY_TEST = '';
    const prisma = makePrisma([makeNode()]);
    const health = vi.fn(async () => true);

    const job = new NodeHealthJob(prisma as never);
    job.makeClient = () => ({ health }) as never;

    await job.run();

    expect(health).not.toHaveBeenCalled();
    expect(prisma.node.update).not.toHaveBeenCalled();
  });

  it('не роняет проход, когда один узел бросает исключение', async () => {
    process.env.WG_KEY_TEST = 'secret';
    const prisma = makePrisma([makeNode({ id: 'bad' }), makeNode({ id: 'good' })]);

    const job = new NodeHealthJob(prisma as never);
    job.makeClient = (baseUrl: string) =>
      ({
        health: async () => {
          if (baseUrl.includes('bad')) {
            throw new Error('unreachable');
          }

          return true;
        },
      }) as never;

    await expect(job.run()).resolves.toBeUndefined();
  });

  it('проверяет узлы параллельно, а не по очереди', async () => {
    process.env.WG_KEY_TEST = 'secret';
    const nodes = Array.from({ length: 4 }, (_, i) => makeNode({ id: `node-${i}` }));
    const prisma = makePrisma(nodes);

    let running = 0;
    let peak = 0;

    const job = new NodeHealthJob(prisma as never);
    job.makeClient = () =>
      ({
        health: async () => {
          running += 1;
          peak = Math.max(peak, running);
          await new Promise((resolve) => setTimeout(resolve, 10));
          running -= 1;

          return true;
        },
      }) as never;

    await job.run();

    expect(peak).toBeGreaterThan(1);
  });
});
