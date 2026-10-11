import { addDays, addHours, subDays, subHours } from 'date-fns';
import { describe, expect, it } from 'vitest';

import { periodKind, trialState } from '../trial-state';

const future = addDays(new Date(), 1);
const past = subDays(new Date(), 1);

describe('trialState', () => {
  it('offers a trial to an account with no subscription row at all', () => {
    expect(trialState(null).isTrialAvailable).toBe(true);
  });

  it('offers a trial to a row that has neither had one nor ever had a period', () => {
    expect(trialState({ currentPeriodEnd: null, trialStartedAt: null }).isTrialAvailable).toBe(true);
  });

  it('never offers a second one, which is the whole point of storing the timestamp', () => {
    expect(trialState({ currentPeriodEnd: future, trialStartedAt: past }).isTrialAvailable).toBe(false);
  });

  it('still refuses once the trial has run out, rather than treating the lapse as a fresh start', () => {
    expect(trialState({ currentPeriodEnd: past, trialStartedAt: past }).isTrialAvailable).toBe(false);
  });

  it('refuses an account whose paid period lapsed: that is a returning customer, not a new one', () => {
    expect(trialState({ currentPeriodEnd: past, trialStartedAt: null }).isTrialAvailable).toBe(false);
  });

  it('refuses an account that is paying right now', () => {
    expect(trialState({ currentPeriodEnd: future, trialStartedAt: null }).isTrialAvailable).toBe(false);
  });

  it('reports the period it computes, so the status and the server agree on what the access is', () => {
    const row = { currentPeriodEnd: addHours(new Date(), 23), trialStartedAt: subHours(new Date(), 1) };

    expect(trialState(row).period).toBe(periodKind(row));
  });
});

describe('periodKind', () => {
  it('calls a running trial a trial, so buying during one is a first purchase', () => {
    expect(periodKind({ currentPeriodEnd: addHours(new Date(), 23), trialStartedAt: subHours(new Date(), 1) })).toBe('trial');
  });

  it('calls a period a payment extended past the trial day paid', () => {
    expect(periodKind({ currentPeriodEnd: addDays(new Date(), 30), trialStartedAt: past })).toBe('paid');
  });

  it('calls the period of an account that never had a trial paid', () => {
    expect(periodKind({ currentPeriodEnd: future, trialStartedAt: null })).toBe('paid');
  });

  it('says none once any period, trial or paid, is over', () => {
    expect(periodKind({ currentPeriodEnd: past, trialStartedAt: past })).toBe('none');
    expect(periodKind({ currentPeriodEnd: past, trialStartedAt: null })).toBe('none');
  });

  it('says none for an account with no row', () => {
    expect(periodKind(null)).toBe('none');
  });
});
