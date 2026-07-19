import { describe, expect, it, vi } from 'vitest';

import { RecurringChargeJob } from '../recurring-charge.job';

const makeConfig = () => ({
  get: (key: string) =>
    ({
      YOOKASSA_SHOP_ID: 'shop-1',
      YOOKASSA_SECRET_KEY: 'secret-1',
      SUBSCRIPTION_PRICE_RUB: 100,
    })[key],
});

const makeSubscription = (over: Record<string, unknown> = {}) => ({
  userId: 'user-1',
  yookassaPaymentMethodId: 'pm-1',
  ...over,
});

const makePrisma = (rows: unknown[]) => ({
  subscription: {
    findMany: vi.fn(async () => rows),
    update: vi.fn(async () => ({ id: 'sub-1' })),
  },
  payment: {
    create: vi.fn(async () => ({ id: 'row-1' })),
  },
});

describe('RecurringChargeJob', () => {
  it('списывает по сохранённому способу оплаты', async () => {
    const prisma = makePrisma([makeSubscription()]);
    const chargeRecurring = vi.fn(async () => ({
      id: 'pay-2',
      status: 'succeeded',
      confirmationUrl: null,
    }));

    const job = new RecurringChargeJob(prisma as never, makeConfig() as never);
    job.makeClient = () => ({ chargeRecurring }) as never;

    await job.run();

    expect(chargeRecurring).toHaveBeenCalledWith(
      expect.objectContaining({ paymentMethodId: 'pm-1', amountRub: 100 }),
    );
    expect(prisma.payment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ isRecurring: true, yookassaPaymentId: 'pay-2' }),
      }),
    );
  });

  it('переводит подписку в expired, когда списание не прошло', async () => {
    const prisma = makePrisma([makeSubscription()]);
    const job = new RecurringChargeJob(prisma as never, makeConfig() as never);
    job.makeClient = () =>
      ({
        chargeRecurring: async () => {
          throw new Error('card declined');
        },
      }) as never;

    await job.run();

    expect(prisma.subscription.update).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      data: { status: 'expired' },
    });
  });

  it('выбирает только подписки без отменённого автопродления', async () => {
    const prisma = makePrisma([]);
    const job = new RecurringChargeJob(prisma as never, makeConfig() as never);
    job.makeClient = () => ({ chargeRecurring: vi.fn() }) as never;

    await job.run();

    const [args] = prisma.subscription.findMany.mock.calls[0] as unknown as [
      { where: { cancelAtPeriodEnd: boolean; status: string } },
    ];

    expect(args.where.cancelAtPeriodEnd).toBe(false);
    expect(args.where.status).toBe('active');
  });

  it('пропускает подписку без сохранённого способа оплаты', async () => {
    const prisma = makePrisma([makeSubscription({ yookassaPaymentMethodId: null })]);
    const chargeRecurring = vi.fn();

    const job = new RecurringChargeJob(prisma as never, makeConfig() as never);
    job.makeClient = () => ({ chargeRecurring }) as never;

    await job.run();

    expect(chargeRecurring).not.toHaveBeenCalled();
  });

  it('не продлевает подписку сам — это делает вебхук', async () => {
    const prisma = makePrisma([makeSubscription()]);
    const job = new RecurringChargeJob(prisma as never, makeConfig() as never);
    job.makeClient = () =>
      ({
        chargeRecurring: async () => ({ id: 'pay-2', status: 'succeeded', confirmationUrl: null }),
      }) as never;

    await job.run();

    expect(prisma.subscription.update).not.toHaveBeenCalled();
  });
});
