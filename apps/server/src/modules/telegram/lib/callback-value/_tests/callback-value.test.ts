import { describe, expect, it } from 'vitest';

import { AUTO_RENEW_CHOICE, CONFIRMED } from '../../../config';
import { autoRenewChoice, countFrom, isConfirmed } from '../callback-value';

describe('isConfirmed', () => {
  it('accepts only the exact confirming payload', () => {
    expect(isConfirmed(CONFIRMED)).toBe(true);
    expect(isConfirmed('no')).toBe(false);
    expect(isConfirmed('')).toBe(false);
    expect(isConfirmed(`${CONFIRMED} `)).toBe(false);
  });
});

describe('countFrom', () => {
  it('accepts a count inside the range', () => {
    expect(countFrom('1', 8)).toBe(1);
    expect(countFrom('8', 8)).toBe(8);
  });

  it('refuses anything past the limit, so a crafted payload cannot overbuy', () => {
    expect(countFrom('9', 8)).toBeNull();
    expect(countFrom('1000', 8)).toBeNull();
  });

  it('refuses a number Number() would otherwise accept', () => {
    expect(countFrom(' 2', 8)).toBeNull();
    expect(countFrom('0x2', 8)).toBeNull();
    expect(countFrom('1e3', 8)).toBeNull();
    expect(countFrom('Infinity', 8)).toBeNull();
  });

  it('refuses what is not a whole positive number', () => {
    expect(countFrom('0', 8)).toBeNull();
    expect(countFrom('-1', 8)).toBeNull();
    expect(countFrom('1.5', 8)).toBeNull();
    expect(countFrom('two', 8)).toBeNull();
    expect(countFrom('', 8)).toBeNull();
  });
});

describe('autoRenewChoice', () => {
  it('reads the two choices a button can carry', () => {
    expect(autoRenewChoice(AUTO_RENEW_CHOICE.on)).toBe(AUTO_RENEW_CHOICE.on);
    expect(autoRenewChoice(AUTO_RENEW_CHOICE.off)).toBe(AUTO_RENEW_CHOICE.off);
  });

  // Reading anything unrecognised as "off" would let a crafted payload turn a
  // paying reader's renewal off without them asking.
  it('refuses anything else rather than falling back to off', () => {
    expect(autoRenewChoice('anything')).toBeNull();
    expect(autoRenewChoice('')).toBeNull();
    expect(autoRenewChoice('ON')).toBeNull();
    expect(autoRenewChoice(CONFIRMED)).toBeNull();
  });
});
