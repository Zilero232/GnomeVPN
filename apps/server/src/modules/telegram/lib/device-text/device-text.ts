import { isEmpty } from 'remeda';

import type { DeviceLineInput, DeviceNameInput, DevicesTextInput } from './device-text.types';

import { BOT_TEXT, NEW_LINE } from '../../config';
import { fillText } from '../fill-text';
import { formatDate } from '../format-date';
import { present } from './device-text.helpers';

export const deviceName = ({ device, locale }: DeviceNameInput): string =>
  present([device.model, device.app]).at(0) ?? BOT_TEXT[locale].deviceUnnamed;

export const deviceLabel = ({ device, index, locale }: DeviceLineInput): string => `${index + 1}. ${deviceName({ device, locale })}`;

export const deviceLine = ({ device, index, locale }: DeviceLineInput): string => {
  const text = BOT_TEXT[locale];
  const name = deviceName({ device, locale });
  const system = present([device.platform, device.osVersion]).join(' ');
  const details = present([system, device.app === name ? null : device.app]).join(', ');
  const title = present([deviceLabel({ device, index, locale }), details]).join(' — ');
  const mark = device.isOverLimit ? ` ${text.deviceOverLimit}` : '';
  const lastSeen = fillText({ text: text.deviceLastSeen, fill: { date: formatDate({ iso: device.lastSeenAt, locale }) } });

  return [`${title}${mark}`, lastSeen].join(NEW_LINE);
};

export const devicesText = ({ list, locale }: DevicesTextInput): string => {
  const text = BOT_TEXT[locale];
  const header = fillText({ text: text.devicesHeader, fill: { count: String(list.devices.length), limit: String(list.deviceLimit) } });

  if (isEmpty(list.devices)) {
    return [header, '', text.devicesEmpty].join(NEW_LINE);
  }

  const lines = list.devices.map((device, index) => deviceLine({ device, index, locale }));

  return [header, ...lines].join(`${NEW_LINE}${NEW_LINE}`);
};
