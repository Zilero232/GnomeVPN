import { describe, expect, it } from 'vitest';

import { deviceDetails, deviceName } from '../device-label';

const EMPTY = { model: null, platform: null, osVersion: null, app: null };

describe('deviceName', () => {
  it('prefers the hardware model, which is what the person recognises their device by', () => {
    expect(deviceName({ ...EMPTY, model: 'Pixel 8', app: 'INCY' })).toBe('Pixel 8');
  });

  it('falls back to the app name when the app sends no model', () => {
    expect(deviceName({ ...EMPTY, app: 'Hiddify' })).toBe('Hiddify');
  });

  it('answers null when there is nothing to name the device by, so the caller can pick a generic label', () => {
    expect(deviceName(EMPTY)).toBeNull();
  });
});

describe('deviceDetails', () => {
  it('joins the platform and its version into one line', () => {
    expect(deviceDetails({ ...EMPTY, model: 'Pixel 8', platform: 'Android', osVersion: '15', app: 'INCY' })).toEqual(['Android 15', 'INCY']);
  });

  it('keeps whichever half of the system is known', () => {
    expect(deviceDetails({ ...EMPTY, osVersion: '17.5' })).toEqual(['17.5']);
    expect(deviceDetails({ ...EMPTY, platform: 'Windows' })).toEqual(['Windows']);
  });

  it('leaves the app out when it already serves as the name', () => {
    expect(deviceDetails({ ...EMPTY, platform: 'iOS', app: 'Streisand' })).toEqual(['iOS']);
  });

  it('answers an empty list when nothing is known', () => {
    expect(deviceDetails(EMPTY)).toEqual([]);
  });
});
