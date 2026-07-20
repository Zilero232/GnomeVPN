import type { Prisma } from '../../../../generated';

// NULL < date is NULL in SQL, not true, so a user who never paid needs its own
// branch — otherwise those rows never match and their access is never revoked.
export const lapsedBefore = (moment: Date): Prisma.UserWhereInput => ({
  OR: [
    { subscription: null },
    { subscription: { currentPeriodEnd: null } },
    { subscription: { currentPeriodEnd: { lt: moment } } },
  ],
});
