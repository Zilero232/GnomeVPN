import { describe, expect, it } from 'vitest';

import { deviceIdentity } from '../device-identity';

const HWID = '270dd26e-160d-4257-b8ac-654800e12f24';

describe('deviceIdentity', () => {
  it('keys an INCY device by its hardware id, upper-cased', () => {
    const identity = deviceIdentity({
      'user-agent': 'INCY/2.4.1/Android',
      'x-hwid': HWID,
      'x-device-os': 'Android',
      'x-ver-os': '14',
      'x-device-model': 'Pixel 8'
    });

    expect(identity).toEqual({
      key: `hwid:${HWID.toUpperCase()}`,
      hwid: HWID.toUpperCase(),
      platform: 'Android',
      model: 'Pixel 8',
      osVersion: '14',
      app: 'INCY'
    });
  });

  it('accepts the Android alias of the hardware id', () => {
    expect(deviceIdentity({ 'x-device-id': HWID }).hwid).toBe(HWID.toUpperCase());
  });

  it('falls back to the app when no hardware id is sent', () => {
    const identity = deviceIdentity({ 'user-agent': 'Hiddify/2.5.7 (android)' });

    expect(identity.key).toBe('app:hiddify');
    expect(identity.hwid).toBeNull();
    expect(identity.app).toBe('Hiddify');
  });

  it('gives INCY with hardware ids switched off one shared key and reads its platform from the agent', () => {
    const identity = deviceIdentity({ 'user-agent': 'INCY/2.4.1/iOS' });

    expect(identity.key).toBe('app:incy');
    expect(identity.platform).toBe('iOS');
  });

  it('keys a request with no agent at all as unknown', () => {
    expect(deviceIdentity({}).key).toBe('app:unknown');
  });

  it('ignores a hardware id that is not shaped like one', () => {
    expect(deviceIdentity({ 'x-hwid': 'x; DROP TABLE device' }).hwid).toBeNull();
  });

  it('strips control characters and caps the length of free-text fields', () => {
    const identity = deviceIdentity({ 'x-device-model': `Pixel\u0000 8${'x'.repeat(200)}` });

    expect(identity.model?.startsWith('Pixel 8')).toBe(true);
    expect(identity.model).toHaveLength(64);
  });

  it('reads the first value of a repeated header', () => {
    expect(deviceIdentity({ 'x-device-model': ['Pixel 8', 'other'] }).model).toBe('Pixel 8');
  });
});
