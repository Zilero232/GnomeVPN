import { describe, expect, it, vi } from 'vitest';

import { BillingService } from '../billing.service';

const makeConfig = () => ({
  get: (key: string) =>
    ({
      YOOKASSA_SHOP_ID: 'shop-1',
      YOOKASSA_SECRET_KEY: 'secret-1',
      YOOKASSA_RETURN_URL: 'https://app.test/account',
      SUBSCRIPTION_PRICE_RUB: 100,
    })[key],
});

const makePrisma = () => ({
  payment: {
    create: vi.fn(async () => ({ id: 'row-1' })),
    findUnique: vi.fn(async () => null),
    update: vi.fn(async () => ({ id: 'row-1' })),
  },
  subscription: {
    findUnique: vi.fn(async () => null),
    update: vi.fn(async () => ({ id: 'sub-1' })),
  },
});

const pendingPayment = {
  id: 'pay-1',
  status: 'pending',
  confirmationUrl: 'https://pay.test/1',
};

describe('BillingService.createCheckout', () => {
  it('возвращает confirmationUrl и пишет pending-платёж', async () => {
    const prisma = makePrisma();
    const yookassa = { createPayment: vi.fn(async () => pendingPayment) };

    const service = new BillingService(prisma as never, makeConfig() as never);
    service.makeClient = () => yookassa as never;

    const result = await service.createCheckout('user-1');

    expect(result.confirmationUrl).toBe('https://pay.test/1');
    expect(prisma.payment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          yookassaPaymentId: 'pay-1',
          status: 'pending',
          isRecurring: false,
        }),
      }),
    );
  });

  it('просит ЮKassa сохранить способ оплаты для рекуррента', async () => {
    const prisma = makePrisma();
    const yookassa = { createPayment: vi.fn(async () => pendingPayment) };

    const service = new BillingService(prisma as never, makeConfig() as never);
    service.makeClient = () => yookassa as never;

    await service.createCheckout('user-1');

    expect(yookassa.createPayment).toHaveBeenCalledWith(
      expect.objectContaining({ savePaymentMethod: true, amountRub: 100 }),
    );
  });

  it('бросает, когда ЮKassa не вернула ссылку', async () => {
    const prisma = makePrisma();
    const yookassa = {
      createPayment: vi.fn(async () => ({ ...pendingPayment, confirmationUrl: null })),
    };

    const service = new BillingService(prisma as never, makeConfig() as never);
    service.makeClient = () => yookassa as never;

    await expect(service.createCheckout('user-1')).rejects.toThrow();
  });
});

describe('BillingService.handleWebhook', () => {
  const succeededEvent = {
    event: 'payment.succeeded' as const,
    object: { id: 'pay-1', status: 'succeeded' },
  };

  const succeededClient = () =>
    ({
      getPayment: async () => ({ id: 'pay-1', status: 'succeeded', paymentMethodId: 'pm-1' }),
    }) as never;

  it('активирует подписку на месяц от текущего момента', async () => {
    const prisma = makePrisma();
    prisma.payment.findUnique = vi.fn(async () => ({
      id: 'row-1',
      userId: 'user-1',
      status: 'pending',
    })) as never;
    prisma.subscription.findUnique = vi.fn(async () => ({ currentPeriodEnd: null })) as never;

    const service = new BillingService(prisma as never, makeConfig() as never);
    service.makeClient = succeededClient;

    await service.handleWebhook(succeededEvent);

    const [update] = prisma.subscription.update.mock.calls[0] as unknown as [
      { data: { status: string; currentPeriodEnd: Date; yookassaPaymentMethodId: string } },
    ];

    expect(update.data.status).toBe('active');
    expect(update.data.yookassaPaymentMethodId).toBe('pm-1');
    expect(update.data.currentPeriodEnd.getTime()).toBeGreaterThan(Date.now());
  });

  it('продлевает от currentPeriodEnd, если он ещё не истёк', async () => {
    const futureEnd = new Date(Date.now() + 10 * 86_400_000);
    const prisma = makePrisma();
    prisma.payment.findUnique = vi.fn(async () => ({
      id: 'row-1',
      userId: 'user-1',
      status: 'pending',
    })) as never;
    prisma.subscription.findUnique = vi.fn(async () => ({
      currentPeriodEnd: futureEnd,
    })) as never;

    const service = new BillingService(prisma as never, makeConfig() as never);
    service.makeClient = succeededClient;

    await service.handleWebhook(succeededEvent);

    const [update] = prisma.subscription.update.mock.calls[0] as unknown as [
      { data: { currentPeriodEnd: Date } },
    ];

    expect(update.data.currentPeriodEnd.getTime()).toBeGreaterThan(futureEnd.getTime());
  });

  it('игнорирует повторную доставку уже обработанного платежа', async () => {
    const prisma = makePrisma();
    prisma.payment.findUnique = vi.fn(async () => ({
      id: 'row-1',
      userId: 'user-1',
      status: 'succeeded',
    })) as never;

    const service = new BillingService(prisma as never, makeConfig() as never);
    service.makeClient = succeededClient;

    await service.handleWebhook(succeededEvent);

    expect(prisma.subscription.update).not.toHaveBeenCalled();
  });

  it('не активирует подписку, если API ЮKassa не подтверждает успех', async () => {
    const prisma = makePrisma();
    prisma.payment.findUnique = vi.fn(async () => ({
      id: 'row-1',
      userId: 'user-1',
      status: 'pending',
    })) as never;

    const service = new BillingService(prisma as never, makeConfig() as never);
    service.makeClient = () =>
      ({
        getPayment: async () => ({ id: 'pay-1', status: 'pending', paymentMethodId: null }),
      }) as never;

    await service.handleWebhook(succeededEvent);

    expect(prisma.subscription.update).not.toHaveBeenCalled();
  });

  it('игнорирует платёж, которого нет в нашей базе', async () => {
    const prisma = makePrisma();

    const service = new BillingService(prisma as never, makeConfig() as never);
    service.makeClient = succeededClient;

    await service.handleWebhook(succeededEvent);

    expect(prisma.subscription.update).not.toHaveBeenCalled();
  });
});

describe('BillingService.cancelAutoRenew', () => {
  it('ставит флаг отмены, не трогая статус', async () => {
    const prisma = makePrisma();
    const service = new BillingService(prisma as never, makeConfig() as never);

    await service.cancelAutoRenew('user-1');

    expect(prisma.subscription.update).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      data: { cancelAtPeriodEnd: true },
    });
  });
});
