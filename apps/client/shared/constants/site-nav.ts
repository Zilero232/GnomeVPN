import { ROUTES } from './routes';

export const SITE_NAV = [
  { key: 'pricing', href: ROUTES.pricing },
  { key: 'setup', href: ROUTES.setup },
  { key: 'faq', href: ROUTES.faq },
  { key: 'about', href: ROUTES.about }
] as const;

export const FOOTER_LINKS = [...SITE_NAV, { key: 'privacy', href: ROUTES.privacy }] as const;
