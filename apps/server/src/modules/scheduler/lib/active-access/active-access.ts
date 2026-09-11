import type { Prisma } from '../../../../../generated';

export const activeSince = (moment: Date): Prisma.UserWhereInput => ({
  subscription: { currentPeriodEnd: { gte: moment } }
});
