import type { Plan } from './plans.types';

export const PLANS = [
  { id: 'monthly', months: 1, priceRub: 200 },
  { id: 'halfYearly', months: 6, priceRub: 990 },
  { id: 'yearly', months: 12, priceRub: 1690 }
] as const satisfies readonly Plan[];

export const DEFAULT_PLAN_ID = 'monthly' as const;

export const LOWEST_MONTHLY_RUB = Math.round(Math.min(...PLANS.map((plan) => plan.priceRub / plan.months)));
