import { ROUTES } from '@/shared/constants';

export const SITE_NAV = [
  { key: 'pricing', href: ROUTES.pricing },
  { key: 'setup', href: ROUTES.setup },
  { key: 'faq', href: ROUTES.faq },
  { key: 'about', href: ROUTES.about }
] as const;
