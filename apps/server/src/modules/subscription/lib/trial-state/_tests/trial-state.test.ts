import { addDays, subDays } from 'date-fns';
import { describe, expect, it } from 'vitest';

import { trialState } from '../trial-state';

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

  it('reports a running trial as one, so the interface can say what the access is', () => {
    expect(trialState({ currentPeriodEnd: future, trialStartedAt: past }).isTrial).toBe(true);
  });

  it('stops calling it a trial once the period is over', () => {
    expect(trialState({ currentPeriodEnd: past, trialStartedAt: past }).isTrial).toBe(false);
  });

  it('does not call a paid period a trial', () => {
    expect(trialState({ currentPeriodEnd: future, trialStartedAt: null }).isTrial).toBe(false);
  });
});
