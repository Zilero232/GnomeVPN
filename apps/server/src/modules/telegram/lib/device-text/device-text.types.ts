import type { Device, DeviceList } from '@gnomevpn/schemas';

import type { BotLocale } from '../../telegram.types';

export type DeviceNameInput = {
  device: Device;
  locale: BotLocale;
};

export type DeviceLineInput = {
  device: Device;
  index: number;
  locale: BotLocale;
};

export type DevicesTextInput = {
  list: DeviceList;
  locale: BotLocale;
};
