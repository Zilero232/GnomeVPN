import { PLANS } from '@gnomevpn/schemas';
import { describe, expect, it } from 'vitest';

import { BOT_LOCALES, BOT_TEXT } from '../../../config';
import { parsePlanId, planButtonLabel } from '../plan-label';

const [plan] = PLANS;

describe('planButtonLabel', () => {
  it('names the term and the price of the plan it is given', () => {
    const label = planButtonLabel({ plan, locale: 'ru' });

    expect(label).toContain(String(plan.months));
    expect(label).toContain(String(plan.priceRub));
  });

  it('carries the month word of the locale it is asked for', () => {
    for (const locale of BOT_LOCALES) {
      expect(planButtonLabel({ plan, locale })).toContain(BOT_TEXT[locale].monthShort);
    }
  });

  it('labels every plan differently, so a button is never ambiguous', () => {
    const labels = PLANS.map((each) => planButtonLabel({ plan: each, locale: 'ru' }));

    expect(new Set(labels).size).toBe(PLANS.length);
  });
});

describe('parsePlanId', () => {
  it('accepts every id we actually render', () => {
    for (const each of PLANS) {
      expect(parsePlanId(each.id)).toBe(each.id);
    }
  });

  it('refuses anything that is not a plan', () => {
    expect(parsePlanId('made-up')).toBeNull();
    expect(parsePlanId('')).toBeNull();
    expect(parsePlanId('__proto__')).toBeNull();
  });
});
