import { describe, expect, it } from 'vitest';

import { findPlan, planDiscountPercent, planMonthlyRub } from '../plans';
import { LOWEST_MONTHLY_RUB, PLANS } from '../plans.constants';

const MONTHLY = PLANS[0];

describe('findPlan', () => {
  it('returns the very entry that carries the id', () => {
    for (const plan of PLANS) {
      expect(findPlan(plan.id)).toBe(plan);
    }
  });

  it('throws on an id that matches no plan', () => {
    expect(() => findPlan('weekly' as 'monthly')).toThrow('Unknown plan: weekly');
  });
});

describe('planDiscountPercent', () => {
  it('gives the monthly plan no discount', () => {
    expect(planDiscountPercent('monthly')).toBe(0);
  });

  it('matches the discount recomputed from the plan table', () => {
    for (const plan of PLANS) {
      const full = MONTHLY.priceRub * plan.months;

      expect(planDiscountPercent(plan.id)).toBe(Math.round(((full - plan.priceRub) / full) * 100));
    }
  });

  it('never reports a negative discount', () => {
    for (const plan of PLANS) {
      expect(planDiscountPercent(plan.id)).toBeGreaterThanOrEqual(0);
    }
  });

  it('rewards a longer commitment at least as much as a shorter one', () => {
    const byLength = [...PLANS].sort((left, right) => left.months - right.months);

    for (const [index, plan] of byLength.slice(1).entries()) {
      expect(planDiscountPercent(plan.id)).toBeGreaterThanOrEqual(planDiscountPercent(byLength[index].id));
    }
  });
});

describe('the plan table itself', () => {
  it('keeps the monthly plan first, which every discount is measured against', () => {
    expect(MONTHLY.months).toBe(1);
  });

  it('prices every plan above zero, so no discount divides by zero', () => {
    for (const plan of PLANS) {
      expect(plan.priceRub).toBeGreaterThan(0);
      expect(plan.months).toBeGreaterThan(0);
    }
  });
});

describe('planMonthlyRub', () => {
  it('gives the monthly plan its own price', () => {
    expect(planMonthlyRub('monthly')).toBe(MONTHLY.priceRub);
  });

  it('never exceeds the monthly price for a longer plan', () => {
    for (const plan of PLANS) {
      expect(planMonthlyRub(plan.id)).toBeLessThanOrEqual(MONTHLY.priceRub);
    }
  });

  it('is a whole number of roubles for every plan', () => {
    for (const plan of PLANS) {
      expect(Number.isInteger(planMonthlyRub(plan.id))).toBe(true);
    }
  });
});

describe('LOWEST_MONTHLY_RUB', () => {
  it('undercuts or matches every plan per-month price', () => {
    for (const plan of PLANS) {
      expect(LOWEST_MONTHLY_RUB).toBeLessThanOrEqual(Math.round(plan.priceRub / plan.months));
    }
  });

  it('is a whole number of roubles', () => {
    expect(Number.isInteger(LOWEST_MONTHLY_RUB)).toBe(true);
  });

  it('equals the cheapest plan recomputed from the table', () => {
    expect(LOWEST_MONTHLY_RUB).toBe(Math.round(Math.min(...PLANS.map((plan) => plan.priceRub / plan.months))));
  });
});
