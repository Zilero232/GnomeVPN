import type { PlanId } from './plans.types';

import { PLANS } from './plans.constants';

export const findPlan = (id: PlanId) => {
  const plan = PLANS.find((entry) => entry.id === id);

  if (!plan) {
    throw new Error(`Unknown plan: ${id}`);
  }

  return plan;
};

export const planMonthlyRub = (id: PlanId): number => {
  const plan = findPlan(id);

  return Math.round(plan.priceRub / plan.months);
};

export const planDiscountPercent = (id: PlanId): number => {
  const plan = findPlan(id);
  const monthly = PLANS[0];
  const full = monthly.priceRub * plan.months;

  return full === 0 ? 0 : Math.round(((full - plan.priceRub) / full) * 100);
};
