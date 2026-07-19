import { describe, expect, it, vi } from 'vitest';

import { ExpiredAccessJob } from '../expired-access.job';

const makePrisma = (peers: unknown[]) => ({
  activePeer: {
    findMany: vi.fn(async () => peers),
  },
});

const makeTunnel = () => ({ disconnect: vi.fn(async () => undefined) });

const activeUntil = (minutes: number) => new Date(Date.now() + minutes * 60_000);

describe('ExpiredAccessJob', () => {
  it('снимает пир, когда подписка истекла', async () => {
    const prisma = makePrisma([
      {
        userId: 'user-1',
        user: { subscription: { status: 'active', currentPeriodEnd: activeUntil(-1) } },
      },
    ]);
    const tunnel = makeTunnel();

    await new ExpiredAccessJob(prisma as never, tunnel as never).run();

    expect(tunnel.disconnect).toHaveBeenCalledWith('user-1');
  });

  it('снимает пир, когда подписка переведена в expired', async () => {
    const prisma = makePrisma([
      {
        userId: 'user-1',
        user: { subscription: { status: 'expired', currentPeriodEnd: activeUntil(60) } },
      },
    ]);
    const tunnel = makeTunnel();

    await new ExpiredAccessJob(prisma as never, tunnel as never).run();

    expect(tunnel.disconnect).toHaveBeenCalledWith('user-1');
  });

  it('снимает пир, когда подписки нет вовсе', async () => {
    const prisma = makePrisma([{ userId: 'user-1', user: { subscription: null } }]);
    const tunnel = makeTunnel();

    await new ExpiredAccessJob(prisma as never, tunnel as never).run();

    expect(tunnel.disconnect).toHaveBeenCalledWith('user-1');
  });

  it('не трогает пир с действующей подпиской', async () => {
    const prisma = makePrisma([
      {
        userId: 'user-1',
        user: { subscription: { status: 'active', currentPeriodEnd: activeUntil(60) } },
      },
    ]);
    const tunnel = makeTunnel();

    await new ExpiredAccessJob(prisma as never, tunnel as never).run();

    expect(tunnel.disconnect).not.toHaveBeenCalled();
  });

  it('не роняет проход, когда отключение одного юзера падает', async () => {
    const prisma = makePrisma([
      { userId: 'bad', user: { subscription: null } },
      { userId: 'good', user: { subscription: null } },
    ]);
    const tunnel = {
      disconnect: vi.fn(async (userId: string) => {
        if (userId === 'bad') {
          throw new Error('node unreachable');
        }
      }),
    };

    await expect(
      new ExpiredAccessJob(prisma as never, tunnel as never).run(),
    ).resolves.toBeUndefined();
    expect(tunnel.disconnect).toHaveBeenCalledTimes(2);
  });
});
