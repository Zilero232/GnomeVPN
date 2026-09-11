import { describe, expect, it } from 'vitest';

import { findPlan, LOWEST_MONTHLY_RUB, planDiscountPercent } from '../plans';

describe('findPlan', () => {
  it('returns the monthly plan', () => {
    expect(findPlan('monthly')).toEqual({ id: 'monthly', months: 1, priceRub: 200 });
  });

  it('returns the half-yearly plan', () => {
    expect(findPlan('halfYearly')).toEqual({ id: 'halfYearly', months: 6, priceRub: 990 });
  });

  it('returns the yearly plan', () => {
    expect(findPlan('yearly')).toEqual({ id: 'yearly', months: 12, priceRub: 1690 });
  });

  it('throws on an id that matches no plan', () => {
    expect(() => findPlan('weekly' as 'monthly')).toThrow('Unknown plan: weekly');
  });
});

describe('planDiscountPercent', () => {
  it('gives the monthly plan no discount', () => {
    expect(planDiscountPercent('monthly')).toBe(0);
  });

  it('rounds the half-yearly discount off the full monthly price', () => {
    expect(planDiscountPercent('halfYearly')).toBe(18);
  });

  it('rounds the yearly discount off the full monthly price', () => {
    expect(planDiscountPercent('yearly')).toBe(30);
  });
});

describe('LOWEST_MONTHLY_RUB', () => {
  it('is the cheapest per-month price across the plans', () => {
    expect(LOWEST_MONTHLY_RUB).toBe(141);
  });
});
