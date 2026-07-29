import { LOWEST_MONTHLY_RUB } from '@gnomevpn/schemas';

export const HERO_METRICS = [
  { value: 'Hysteria2', key: 'protocol' },
  { value: `${LOWEST_MONTHLY_RUB} ₽`, key: 'price' },
  { value: 'TLS 1.3', key: 'cipher' }
] as const;

export const PRICING_FEATURES = ['feature1', 'feature2', 'feature3', 'feature4'] as const;

export const HOW_IT_WORKS_STEPS = ['step1', 'step2', 'step3'] as const;

export const FEATURE_CARDS = ['split', 'devices', 'autostart', 'lan', 'noLogs', 'updates'] as const;

export const FAQ_ITEMS = ['1', '2', '3', '4'] as const;

export const FEATURED_PLAN_ID = 'yearly' as const;

export type FeatureCard = (typeof FEATURE_CARDS)[number];

export const PLATFORMS = [
  { key: 'windows', name: 'Windows', isNative: true },
  { key: 'android', name: 'Android', isNative: true },
  { key: 'apple', name: 'macOS · iOS', isNative: false },
  { key: 'linux', name: 'Linux', isNative: false }
] as const;
