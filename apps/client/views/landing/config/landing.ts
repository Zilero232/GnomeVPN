import { LOWEST_MONTHLY_RUB, PLANS } from '@gnomevpn/schemas';

export const HERO_METRICS = [
  { value: 'Hysteria2', key: 'protocol' },
  { value: `${LOWEST_MONTHLY_RUB} ₽`, key: 'price' },
  { value: 'TLS 1.3', key: 'cipher' },
] as const;

export const PRICING_FEATURES = ['feature1', 'feature2', 'feature3', 'feature4'] as const;

export const HOW_IT_WORKS_STEPS = ['step1', 'step2', 'step3'] as const;

export const FAQ_ITEMS = ['1', '2', '3', '4'] as const;

export const FEATURED_PLAN_ID = PLANS[PLANS.length - 1].id;
