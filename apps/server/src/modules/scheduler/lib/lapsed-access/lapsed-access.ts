import type { Prisma } from '../../../../../generated';

export const lapsedBefore = (moment: Date): Prisma.UserWhereInput => ({
  OR: [
    { subscription: null },
    { subscription: { currentPeriodEnd: null } },
    { subscription: { currentPeriodEnd: { lt: moment } } },
  ],
});
