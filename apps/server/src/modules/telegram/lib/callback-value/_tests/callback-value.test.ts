import { describe, expect, it } from 'vitest';

import { AUTO_RENEW_CHOICE, CONFIRMED, DECLINED, SUBJECT_SEPARATOR } from '../../../config';
import { autoRenewChoice, countFrom, deviceAnswer, isConfirmed, parseDeviceId } from '../callback-value';

const deviceId = '3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b';

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

describe('parseDeviceId', () => {
  it('accepts a device id', () => {
    expect(parseDeviceId(deviceId)).toBe(deviceId);
  });

  it('refuses anything that is not shaped like one, so a crafted press reaches no query', () => {
    expect(parseDeviceId('')).toBeNull();
    expect(parseDeviceId(` ${deviceId}`)).toBeNull();
    expect(parseDeviceId(`${deviceId}x`)).toBeNull();
    expect(parseDeviceId('__proto__')).toBeNull();
    expect(parseDeviceId(deviceId.replaceAll('-', ''))).toBeNull();
  });
});

describe('deviceAnswer', () => {
  it('reads a yes and a no for the same device', () => {
    expect(deviceAnswer(`${CONFIRMED}${SUBJECT_SEPARATOR}${deviceId}`)).toEqual({ isConfirmed: true, deviceId });
    expect(deviceAnswer(`${DECLINED}${SUBJECT_SEPARATOR}${deviceId}`)).toEqual({ isConfirmed: false, deviceId });
  });

  it('refuses an answer that is neither yes nor no rather than reading it as one', () => {
    expect(deviceAnswer(`maybe${SUBJECT_SEPARATOR}${deviceId}`)).toBeNull();
    expect(deviceAnswer(`${SUBJECT_SEPARATOR}${deviceId}`)).toBeNull();
  });

  it('refuses a payload without a well-formed device', () => {
    expect(deviceAnswer(CONFIRMED)).toBeNull();
    expect(deviceAnswer(`${CONFIRMED}${SUBJECT_SEPARATOR}`)).toBeNull();
    expect(deviceAnswer(`${CONFIRMED}${SUBJECT_SEPARATOR}not-a-device`)).toBeNull();
    expect(deviceAnswer(`${CONFIRMED}${SUBJECT_SEPARATOR}${deviceId}${SUBJECT_SEPARATOR}extra`)).toBeNull();
  });
});
