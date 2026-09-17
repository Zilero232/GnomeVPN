import { DEFAULT_DEVICE_LIMIT, LOWEST_MONTHLY_RUB } from '@gnomevpn/schemas';

export const HERO_METRICS = [
  { value: 'Hysteria2', key: 'protocol' },
  { value: `${LOWEST_MONTHLY_RUB} ₽`, key: 'price' },
  { value: String(DEFAULT_DEVICE_LIMIT), key: 'devices' }
] as const;

export const HOW_IT_WORKS_STEPS = ['step1', 'step2', 'step3'] as const;

export const FEATURE_CARDS = ['protocol', 'devices', 'platforms', 'locations', 'noLogs', 'openFormat'] as const;

export const LOCATIONS = [
  { code: 'nl', key: 'netherlands' },
  { code: 'fi', key: 'finland' }
] as const;

export const COMPARISON_ROWS = ['speed', 'ads', 'blocking', 'limits'] as const;

export type FeatureCard = (typeof FEATURE_CARDS)[number];
