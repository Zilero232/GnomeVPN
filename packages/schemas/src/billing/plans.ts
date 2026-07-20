import { z } from 'zod';

export const planIdSchema = z.enum(['monthly', 'halfYearly', 'yearly']);

export const planSchema = z.object({
  id: planIdSchema,
  months: z.number().int().positive(),
  priceRub: z.number().int().positive(),
});

export const PLANS = [
  { id: 'monthly', months: 1, priceRub: 100 },
  { id: 'halfYearly', months: 6, priceRub: 500 },
  { id: 'yearly', months: 12, priceRub: 900 },
] as const satisfies readonly z.infer<typeof planSchema>[];

export const DEFAULT_PLAN_ID = 'monthly' as const;

export const LOWEST_MONTHLY_RUB = Math.round(
  Math.min(...PLANS.map((plan) => plan.priceRub / plan.months)),
);

export const findPlan = (id: z.infer<typeof planIdSchema>) => {
  const plan = PLANS.find((entry) => entry.id === id);

  if (!plan) {
    throw new Error(`Unknown plan: ${id}`);
  }

  return plan;
};

export const planDiscountPercent = (id: z.infer<typeof planIdSchema>): number => {
  const plan = findPlan(id);
  const monthly = PLANS[0];
  const full = monthly.priceRub * plan.months;

  return full === 0 ? 0 : Math.round(((full - plan.priceRub) / full) * 100);
};
