import { ROUTES } from './routes';

export const SITE_NAV = [
  { key: 'pricing', href: ROUTES.pricing },
  { key: 'setup', href: ROUTES.setup },
  { key: 'servers', href: ROUTES.servers },
  { key: 'faq', href: ROUTES.faq },
  { key: 'about', href: ROUTES.about }
] as const;

export const FOOTER_NAV = [
  { key: 'pricing', href: ROUTES.pricing },
  { key: 'setup', href: ROUTES.setup },
  { key: 'servers', href: ROUTES.servers },
  { key: 'faq', href: ROUTES.faq },
  { key: 'about', href: ROUTES.about },
  { key: 'privacy', href: ROUTES.privacy }
] as const;
