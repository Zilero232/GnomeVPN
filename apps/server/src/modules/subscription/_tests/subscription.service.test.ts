import { describe, expect, it } from 'vitest';

import { SubscriptionService } from '../subscription.service';

const makeService = (row: unknown) => {
  const prisma = {
    subscription: { findUnique: async () => row },
  };

  return new SubscriptionService(prisma as never);
};

const inADay = () => new Date(Date.now() + 86_400_000);

describe('SubscriptionService.hasActiveAccess', () => {
  it('отказывает, когда подписки нет', async () => {
    const service = makeService(null);

    expect(await service.hasActiveAccess('user-1')).toBe(false);
  });

  it('отказывает при status=expired', async () => {
    const service = makeService({ status: 'expired', currentPeriodEnd: inADay() });

    expect(await service.hasActiveAccess('user-1')).toBe(false);
  });

  it('отказывает при status=canceled', async () => {
    const service = makeService({ status: 'canceled', currentPeriodEnd: inADay() });

    expect(await service.hasActiveAccess('user-1')).toBe(false);
  });

  it('отказывает, когда период истёк', async () => {
    const service = makeService({
      status: 'active',
      currentPeriodEnd: new Date(Date.now() - 1000),
    });

    expect(await service.hasActiveAccess('user-1')).toBe(false);
  });

  it('отказывает, когда currentPeriodEnd пуст', async () => {
    const service = makeService({ status: 'active', currentPeriodEnd: null });

    expect(await service.hasActiveAccess('user-1')).toBe(false);
  });

  it('пропускает активную подписку с будущим периодом', async () => {
    const service = makeService({ status: 'active', currentPeriodEnd: inADay() });

    expect(await service.hasActiveAccess('user-1')).toBe(true);
  });
});

describe('SubscriptionService.getStatus', () => {
  it('возвращает expired, когда записи нет', async () => {
    const service = makeService(null);

    expect(await service.getStatus('user-1')).toEqual({
      status: 'expired',
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    });
  });

  it('отдаёт дату окончания в ISO и флаг отмены', async () => {
    const end = inADay();
    const service = makeService({
      status: 'active',
      currentPeriodEnd: end,
      cancelAtPeriodEnd: true,
    });

    const status = await service.getStatus('user-1');

    expect(status.status).toBe('active');
    expect(status.currentPeriodEnd).toBe(end.toISOString());
    expect(status.cancelAtPeriodEnd).toBe(true);
  });
});
