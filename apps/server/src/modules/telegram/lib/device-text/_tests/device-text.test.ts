import type { Device, DeviceList } from '@gnomevpn/schemas';

import { describe, expect, it } from 'vitest';

import { BOT_LOCALES, BOT_TEXT, NEW_LINE } from '../../../config';
import { formatDate } from '../../format-date';
import { deviceLabel, deviceLine, deviceName, devicesText } from '../device-text';

const device = (overrides: Partial<Device> = {}): Device => ({
  id: '3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b',
  model: 'Pixel 8',
  platform: 'Android',
  osVersion: '15',
  app: 'INCY',
  isIdentified: true,
  isOverLimit: false,
  createdAt: '2026-03-01T12:00:00.000Z',
  lastSeenAt: '2026-03-09T12:00:00.000Z',
  ...overrides
});

const listOf = (devices: Device[], deviceLimit = 2): DeviceList => ({ devices, deviceLimit });

describe('deviceName', () => {
  it('prefers the model, then the app, then a word for an unnamed device', () => {
    for (const locale of BOT_LOCALES) {
      expect(deviceName({ device: device(), locale })).toBe('Pixel 8');
      expect(deviceName({ device: device({ model: null }), locale })).toBe('INCY');
      expect(deviceName({ device: device({ model: null, app: null }), locale })).toBe(BOT_TEXT[locale].deviceUnnamed);
    }
  });

  it('skips a blank model rather than naming the device with nothing', () => {
    expect(deviceName({ device: device({ model: '  ' }), locale: 'en' })).toBe('INCY');
  });
});

describe('deviceLabel', () => {
  it('numbers from one, so a button matches its line', () => {
    expect(deviceLabel({ device: device(), index: 0, locale: 'en' })).toBe('1. Pixel 8');
  });
});

describe('deviceLine', () => {
  it('shows the system, the app and when the device was last seen', () => {
    for (const locale of BOT_LOCALES) {
      const line = deviceLine({ device: device(), index: 0, locale });

      expect(line).toContain('Android 15');
      expect(line).toContain('INCY');
      expect(line).toContain(formatDate({ iso: device().lastSeenAt, locale }));
    }
  });

  it('does not repeat the app when it already names the device', () => {
    const line = deviceLine({ device: device({ model: null }), index: 0, locale: 'en' });

    expect(line.split('INCY')).toHaveLength(2);
  });

  it('marks only a device over the limit', () => {
    for (const locale of BOT_LOCALES) {
      expect(deviceLine({ device: device({ isOverLimit: true }), index: 0, locale })).toContain(BOT_TEXT[locale].deviceOverLimit);
      expect(deviceLine({ device: device(), index: 0, locale })).not.toContain(BOT_TEXT[locale].deviceOverLimit);
    }
  });

  it('leaves out what the app did not report', () => {
    const line = deviceLine({ device: device({ model: null, platform: null, osVersion: null, app: null }), index: 0, locale: 'en' });
    const [title] = line.split(NEW_LINE);

    expect(title).toBe(`1. ${BOT_TEXT.en.deviceUnnamed}`);
  });
});

describe('devicesText', () => {
  it('counts the devices against the limit', () => {
    const limit = 7;
    const devices = [device(), device(), device()];
    const [header] = devicesText({ list: listOf(devices, limit), locale: 'en' }).split(NEW_LINE);

    expect(header).toContain(String(devices.length));
    expect(header).toContain(String(limit));
  });

  it('gives every device its own numbered line', () => {
    const text = devicesText({ list: listOf([device({ model: 'Pixel 8' }), device({ model: 'iPhone 15' })]), locale: 'en' });

    expect(text).toContain('1. Pixel 8');
    expect(text).toContain('2. iPhone 15');
  });

  it('explains how a device appears when there are none yet', () => {
    for (const locale of BOT_LOCALES) {
      expect(devicesText({ list: listOf([]), locale })).toContain(BOT_TEXT[locale].devicesEmpty);
    }
  });
});
