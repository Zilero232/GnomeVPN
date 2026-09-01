import type { Plan } from '@gnomevpn/schemas';

import { describe, expect, it } from 'vitest';

import { describePlan, describeRenewal, describeSubscription } from '../plan-description';

const plan = (months: number): Plan => ({ id: 'monthly', months, priceRub: 100 });

describe('describeSubscription', () => {
  it('uses the singular month form for one month', () => {
    expect(describeSubscription({ kind: 'purchase', plan: plan(1) })).toBe('Подписка GnomeVPN на 1 месяц');
  });

  it('uses the few form for two months', () => {
    expect(describeSubscription({ kind: 'purchase', plan: plan(2) })).toBe('Подписка GnomeVPN на 2 месяца');
  });

  it('uses the few form for four months', () => {
    expect(describeSubscription({ kind: 'purchase', plan: plan(4) })).toBe('Подписка GnomeVPN на 4 месяца');
  });

  it('uses the many form for six months', () => {
    expect(describeSubscription({ kind: 'purchase', plan: plan(6) })).toBe('Подписка GnomeVPN на 6 месяцев');
  });

  it('uses the many form for twelve months', () => {
    expect(describeSubscription({ kind: 'purchase', plan: plan(12) })).toBe('Подписка GnomeVPN на 12 месяцев');
  });

  it('uses the many form for eleven months', () => {
    expect(describeSubscription({ kind: 'purchase', plan: plan(11) })).toBe('Подписка GnomeVPN на 11 месяцев');
  });

  it('uses the singular form for twenty one months', () => {
    expect(describeSubscription({ kind: 'purchase', plan: plan(21) })).toBe('Подписка GnomeVPN на 21 месяц');
  });

  it('renders the renewal prefix for the renewal kind', () => {
    expect(describeSubscription({ kind: 'renewal', plan: plan(6) })).toBe('Продление подписки GnomeVPN на 6 месяцев');
  });
});

describe('describePlan', () => {
  it('describes a plan as a purchase', () => {
    expect(describePlan(plan(1))).toBe('Подписка GnomeVPN на 1 месяц');
  });

  it('matches describeSubscription with the purchase kind', () => {
    expect(describePlan(plan(12))).toBe(describeSubscription({ kind: 'purchase', plan: plan(12) }));
  });
});

describe('describeRenewal', () => {
  it('describes a plan as a renewal', () => {
    expect(describeRenewal(plan(1))).toBe('Продление подписки GnomeVPN на 1 месяц');
  });

  it('differs from describePlan only by the prefix', () => {
    const purchase = describePlan(plan(6));
    const renewal = describeRenewal(plan(6));

    expect(purchase).toBe('Подписка GnomeVPN на 6 месяцев');
    expect(renewal).toBe('Продление подписки GnomeVPN на 6 месяцев');
    expect(renewal.endsWith(purchase.replace('Подписка GnomeVPN на', '').trim())).toBe(true);
  });
});
