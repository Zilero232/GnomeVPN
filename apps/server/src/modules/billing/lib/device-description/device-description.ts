import { DEVICE_FORMS, EXTRA_DEVICES_PREFIX } from '../../config';

const rules = new Intl.PluralRules('ru-RU');

const devices = (count: number): string => DEVICE_FORMS[rules.select(count) as keyof typeof DEVICE_FORMS] ?? DEVICE_FORMS.many;

export const describeExtraDevices = (quantity: number): string => `${EXTRA_DEVICES_PREFIX} ${quantity} ${devices(quantity)}`;
