import { ROUTES } from '@/shared/constants';

export const FOOTER_LINKS = [
  { key: 'pricing', href: ROUTES.pricing },
  { key: 'setup', href: ROUTES.setup },
  { key: 'faq', href: ROUTES.faq },
  { key: 'about', href: ROUTES.about },
  { key: 'privacy', href: ROUTES.privacy }
] as const;
