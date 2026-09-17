import { ROUTES } from '@/shared/constants';

export const LLMS_CONTENT_TYPE = 'text/plain; charset=utf-8';

export const LLMS_PAGES = [
  { path: ROUTES.landing, namespace: 'landing' },
  { path: ROUTES.pricing, namespace: 'pricing' },
  { path: ROUTES.setup, namespace: 'setup' },
  { path: ROUTES.faq, namespace: 'faq' },
  { path: ROUTES.about, namespace: 'about' },
  { path: ROUTES.privacy, namespace: 'privacy' }
] as const;
