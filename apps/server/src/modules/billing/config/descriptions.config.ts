import type { PluralForms } from '../lib/pluralize';

export const MONTH_FORMS: PluralForms = {
  one: 'месяц',
  few: 'месяца',
  many: 'месяцев'
};

export const DEVICE_FORMS: PluralForms = {
  one: 'устройство',
  few: 'устройства',
  many: 'устройств'
};

export const SUBSCRIPTION_PREFIX = {
  purchase: 'Подписка GnomeVPN на',
  renewal: 'Продление подписки GnomeVPN на'
} as const;

export const EXTRA_DEVICES_PREFIX = 'Дополнительные устройства GnomeVPN:';
