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
    expect(countFrom({ raw: '1', max: 8 })).toBe(1);
    expect(countFrom({ raw: '8', max: 8 })).toBe(8);
  });

  it('refuses anything past the limit, so a crafted payload cannot overbuy', () => {
    expect(countFrom({ raw: '9', max: 8 })).toBeNull();
    expect(countFrom({ raw: '1000', max: 8 })).toBeNull();
  });

  it('refuses a number Number() would otherwise accept', () => {
    expect(countFrom({ raw: ' 2', max: 8 })).toBeNull();
    expect(countFrom({ raw: '0x2', max: 8 })).toBeNull();
    expect(countFrom({ raw: '1e3', max: 8 })).toBeNull();
    expect(countFrom({ raw: 'Infinity', max: 8 })).toBeNull();
  });

  it('refuses what is not a whole positive number', () => {
    expect(countFrom({ raw: '0', max: 8 })).toBeNull();
    expect(countFrom({ raw: '-1', max: 8 })).toBeNull();
    expect(countFrom({ raw: '1.5', max: 8 })).toBeNull();
    expect(countFrom({ raw: 'two', max: 8 })).toBeNull();
    expect(countFrom({ raw: '', max: 8 })).toBeNull();
  });
});

describe('autoRenewChoice', () => {
  it('reads the two choices a button can carry', () => {
    expect(autoRenewChoice(AUTO_RENEW_CHOICE.on)).toBe(AUTO_RENEW_CHOICE.on);
    expect(autoRenewChoice(AUTO_RENEW_CHOICE.off)).toBe(AUTO_RENEW_CHOICE.off);
  });

  it('refuses anything else rather than falling back to off', () => {
    expect(autoRenewChoice('anything')).toBeNull();
    expect(autoRenewChoice('')).toBeNull();
    expect(autoRenewChoice('ON')).toBeNull();
    expect(autoRenewChoice(CONFIRMED)).toBeNull();
  });
});
