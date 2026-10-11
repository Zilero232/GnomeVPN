import type { DeviceList } from '@gnomevpn/schemas';

import { MAX_EXTRA_DEVICES, resolveLimits } from '@gnomevpn/schemas';
import { describe, expect, it } from 'vitest';

import type { BotMessage } from '../../../telegram.types';

import { BOT_TEXT, CALLBACK_PREFIX } from '../../../config';
import { devicesView } from '../devices-view';

const list: DeviceList = { devices: [], deviceLimit: 2 };

const buttons = (view: BotMessage) => view.markup?.inline_keyboard.flat() ?? [];

const offersPlaces = (view: BotMessage): boolean =>
  buttons(view).some((button) => 'callback_data' in button && button.callback_data.startsWith(CALLBACK_PREFIX.devices));

describe('devicesView', () => {
  it('offers extra places on a paid period', () => {
    expect(offersPlaces(devicesView({ list, status: { period: 'paid', limits: resolveLimits(0) }, locale: 'en' }))).toBe(true);
  });

  it('offers none on a trial, which the server would refuse anyway', () => {
    expect(offersPlaces(devicesView({ list, status: { period: 'trial', limits: resolveLimits(0) }, locale: 'en' }))).toBe(false);
  });

  it('says the cap is reached with a disabled button instead of buttons that would fail', () => {
    const view = devicesView({ list, status: { period: 'paid', limits: resolveLimits(MAX_EXTRA_DEVICES) }, locale: 'en' });
    const disabled = buttons(view).flatMap((button) => ('disabled' in button ? [button.text] : []));

    expect(offersPlaces(view)).toBe(false);
    expect(disabled).toEqual([BOT_TEXT.en.devicesFull]);
  });

  it('offers only the quantities that still fit under the cap', () => {
    const view = devicesView({ list, status: { period: 'paid', limits: resolveLimits(MAX_EXTRA_DEVICES - 1) }, locale: 'en' });
    const offered = buttons(view).flatMap((button) =>
      'callback_data' in button && button.callback_data.startsWith(CALLBACK_PREFIX.devices)
        ? [Number(button.callback_data.slice(CALLBACK_PREFIX.devices.length))]
        : []
    );

    expect(offered).toEqual([1]);
  });

  it('leads with the notice it is given', () => {
    const view = devicesView({ list, status: { period: 'paid', limits: resolveLimits(0) }, locale: 'en', notice: 'Removed' });

    expect(view.text.startsWith('Removed')).toBe(true);
  });
});
