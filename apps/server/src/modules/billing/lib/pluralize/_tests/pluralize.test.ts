import { describe, expect, it } from 'vitest';

import type { PluralForms } from '../pluralize.types';

import { pluralize } from '../pluralize';

const MONTHS: PluralForms = { one: 'месяц', few: 'месяца', many: 'месяцев' };

describe('pluralize', () => {
  it('picks the singular for one', () => {
    expect(pluralize({ count: 1, forms: MONTHS })).toBe('месяц');
  });

  it('picks the few form for two through four', () => {
    expect(pluralize({ count: 2, forms: MONTHS })).toBe('месяца');
    expect(pluralize({ count: 3, forms: MONTHS })).toBe('месяца');
    expect(pluralize({ count: 4, forms: MONTHS })).toBe('месяца');
  });

  it('picks the many form from five upwards', () => {
    expect(pluralize({ count: 5, forms: MONTHS })).toBe('месяцев');
    expect(pluralize({ count: 6, forms: MONTHS })).toBe('месяцев');
    expect(pluralize({ count: 12, forms: MONTHS })).toBe('месяцев');
  });

  it('picks the many form for zero', () => {
    expect(pluralize({ count: 0, forms: MONTHS })).toBe('месяцев');
  });

  it('follows the Russian teens rule, where eleven takes the many form', () => {
    expect(pluralize({ count: 11, forms: MONTHS })).toBe('месяцев');
    expect(pluralize({ count: 14, forms: MONTHS })).toBe('месяцев');
  });

  it('follows the Russian rule past twenty, where twenty-one takes the singular', () => {
    expect(pluralize({ count: 21, forms: MONTHS })).toBe('месяц');
    expect(pluralize({ count: 22, forms: MONTHS })).toBe('месяца');
    expect(pluralize({ count: 25, forms: MONTHS })).toBe('месяцев');
  });

  it('falls back to the many form when the matched category has no form', () => {
    expect(pluralize({ count: 1, forms: { many: 'штук' } })).toBe('штук');
  });

  it('works for any set of forms, not only months', () => {
    const devices: PluralForms = { one: 'устройство', few: 'устройства', many: 'устройств' };

    expect(pluralize({ count: 1, forms: devices })).toBe('устройство');
    expect(pluralize({ count: 3, forms: devices })).toBe('устройства');
    expect(pluralize({ count: 8, forms: devices })).toBe('устройств');
  });
});
