export const ROUTES = {
  landing: '/',
  pricing: '/pricing',
  faq: '/faq',
  setup: '/setup',
  servers: '/servers',
  blog: '/blog',
  about: '/about',
  auth: '/auth',
  resetPassword: '/reset',
  telegramSignIn: '/telegram',
  privacy: '/privacy',
  account: '/account'
} as const;

export const KNOWN_ROUTES: string[] = Object.values(ROUTES);

export const PUBLIC_ROUTES: string[] = [
  ROUTES.landing,
  ROUTES.pricing,
  ROUTES.faq,
  ROUTES.setup,
  ROUTES.servers,
  ROUTES.blog,
  ROUTES.about,
  ROUTES.auth,
  ROUTES.resetPassword,
  ROUTES.telegramSignIn,
  ROUTES.privacy
];

export const GUEST_ONLY_ROUTES: string[] = [ROUTES.auth];

export const INDEXED_ROUTES: string[] = [
  ROUTES.landing,
  ROUTES.pricing,
  ROUTES.faq,
  ROUTES.setup,
  ROUTES.servers,
  ROUTES.blog,
  ROUTES.about,
  ROUTES.privacy
];
