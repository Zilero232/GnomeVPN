import { describe, expect, it } from 'vitest';

import { deviceTitle } from '../device-title';

describe('deviceTitle', () => {
  it('names the model and the app', () => {
    expect(deviceTitle({ model: 'Pixel 8', app: 'INCY', platform: 'Android' })).toBe('Pixel 8 · INCY');
  });

  it('falls back to the platform when the model is unknown', () => {
    expect(deviceTitle({ model: null, app: 'INCY', platform: 'iOS' })).toBe('iOS · INCY');
  });

  it('names a bare app', () => {
    expect(deviceTitle({ model: null, app: 'Hiddify', platform: null })).toBe('Hiddify');
  });

  it('never repeats a part', () => {
    expect(deviceTitle({ model: 'INCY', app: 'INCY', platform: null })).toBe('INCY');
  });

  it('still names a device it knows nothing about', () => {
    expect(deviceTitle({ model: null, app: null, platform: null })).toBe('?');
  });
});
