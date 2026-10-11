import { describe, expect, it } from 'vitest';

import type { BotMessage } from '../../../telegram.types';

import { AUTO_RENEW_CHOICE, BOT_TEXT, CALLBACK_PREFIX } from '../../../config';
import { autoRenewPanel } from '../auto-renew-panel';

const paid = {
  period: 'paid' as const,
  cancelAtPeriodEnd: false,
  hasPaymentMethod: true,
  isRecurringAvailable: true,
  isTrialAvailable: false,
  currentPeriodEnd: '2026-12-31T00:00:00.000Z'
};

const callbacks = (panel: BotMessage): string[] =>
  panel.markup?.inline_keyboard.flat().flatMap((button) => ('callback_data' in button ? [button.callback_data] : [])) ?? [];

describe('autoRenewPanel', () => {
  it('offers to turn renewal off while it is on', () => {
    const panel = autoRenewPanel({ status: paid, locale: 'en' });

    expect(panel.text).toBe(BOT_TEXT.en.autoRenewOn);
    expect(callbacks(panel)).toEqual([`${CALLBACK_PREFIX.autoRenew}${AUTO_RENEW_CHOICE.off}`]);
  });

  it('offers to turn it back on while a card is there to charge', () => {
    const panel = autoRenewPanel({ status: { ...paid, cancelAtPeriodEnd: true }, locale: 'en' });

    expect(callbacks(panel)).toEqual([`${CALLBACK_PREFIX.autoRenew}${AUTO_RENEW_CHOICE.on}`]);
  });

  it('sends a reader with no card to the site rather than offering a switch that cannot work', () => {
    const panel = autoRenewPanel({ status: { ...paid, cancelAtPeriodEnd: true, hasPaymentMethod: false }, locale: 'en' });

    expect(panel.text).toBe(BOT_TEXT.en.autoRenewNeedsCard);
    expect(callbacks(panel).some((data) => data.startsWith(CALLBACK_PREFIX.autoRenew))).toBe(false);
  });

  it('does not claim renewal is on for a subscription that has already lapsed', () => {
    expect(autoRenewPanel({ status: { ...paid, period: 'none' }, locale: 'en' }).text).toBe(BOT_TEXT.en.inactive);
  });

  it('does not offer a switch while the shop cannot charge recurrently at all', () => {
    const panel = autoRenewPanel({ status: { ...paid, isRecurringAvailable: false }, locale: 'en' });

    expect(panel.text).toBe(BOT_TEXT.en.autoRenewUnavailable);
    expect(callbacks(panel).some((data) => data.startsWith(CALLBACK_PREFIX.autoRenew))).toBe(false);
  });

  it('never offers renewal on a trial, which is never charged', () => {
    expect(autoRenewPanel({ status: { ...paid, period: 'trial' }, locale: 'en' }).text).toBe(BOT_TEXT.en.autoRenewTrial);
  });
});
