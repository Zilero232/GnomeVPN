const YOOKASSA_CIDRS = [
  '185.71.76.0/27',
  '185.71.77.0/27',
  '77.75.153.0/25',
  '77.75.156.11/32',
  '77.75.156.35/32',
  '77.75.154.128/25',
  '2a02:5180::/32'
] as const;

const LOOPBACK_CIDRS = ['127.0.0.1/32', '::1/128'] as const;

export const WEBHOOK_ALLOWED_CIDRS: readonly string[] =
  process.env.NODE_ENV === 'production' ? YOOKASSA_CIDRS : [...YOOKASSA_CIDRS, ...LOOPBACK_CIDRS];

export const MONTH_FORMS = {
  one: 'месяц',
  few: 'месяца',
  many: 'месяцев'
} as const;

export const SUBSCRIPTION_PREFIX = {
  purchase: 'Подписка GnomeVPN на',
  renewal: 'Продление подписки GnomeVPN на'
} as const;

export const DEVICE_FORMS = {
  one: 'устройство',
  few: 'устройства',
  many: 'устройств'
} as const;

export const EXTRA_DEVICES_PREFIX = 'Дополнительные устройства GnomeVPN:';
