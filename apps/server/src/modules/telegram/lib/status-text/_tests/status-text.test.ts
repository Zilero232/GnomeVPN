import { PLANS } from '@gnomevpn/schemas';
import { describe, expect, it } from 'vitest';

import type { StatusTextInput } from '../status-text.types';

import { BOT_TEXT } from '../../../config';
import { statusText } from '../status-text';

const active: StatusTextInput = {
  locale: 'ru',
  status: 'active',
  plan: 'monthly',
  currentPeriodEnd: '2026-12-31T00:00:00.000Z',
  cancelAtPeriodEnd: false,
  limits: { deviceLimit: 2, extraDevices: 0, pricePerDeviceRub: 100, maxExtraDevices: 5 }
};

describe('statusText', () => {
  it('names the date the access runs out, which is the one thing the reader opened it for', () => {
    expect(statusText(active)).toContain('2026');
  });

  it('reports the device limit including whatever was bought on top of the plan', () => {
    const withExtra = { ...active, limits: { ...active.limits, deviceLimit: 5, extraDevices: 3 } };

    expect(statusText(withExtra)).toContain('5');
  });

  it('says something different about renewal depending on whether it will renew', () => {
    const renewing = statusText(active);
    const cancelled = statusText({ ...active, cancelAtPeriodEnd: true });

    expect(renewing).not.toBe(cancelled);
    expect(renewing).toContain(BOT_TEXT.ru.willRenew);
    expect(cancelled).toContain(BOT_TEXT.ru.willNotRenew);
  });

  it('falls back to the inactive copy for an expired subscription rather than rendering a stale date', () => {
    expect(statusText({ ...active, status: 'expired' })).toBe(BOT_TEXT.ru.inactive);
  });

  it('treats a missing period as no access rather than formatting an invalid date', () => {
    expect(statusText({ ...active, currentPeriodEnd: null })).toBe(BOT_TEXT.ru.inactive);
  });

  it('answers in the locale it was given, not in one fixed language', () => {
    const russian = statusText(active);
    const english = statusText({ ...active, locale: 'en' });

    expect(russian).not.toBe(english);
    expect(english).toContain(BOT_TEXT.en.willRenew);
  });

  it('names the plan by its term rather than by the id the database stores', () => {
    for (const plan of PLANS) {
      const rendered = statusText({ ...active, plan: plan.id });

      expect(rendered).toContain(String(plan.months));
      expect(rendered).not.toContain(plan.id);
    }
  });
});
