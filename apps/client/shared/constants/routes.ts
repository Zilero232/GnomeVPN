export const ROUTES = {
  landing: '/',
  pricing: '/pricing',
  faq: '/faq',
  setup: '/setup',
  servers: '/servers',
  about: '/about',
  auth: '/auth',
  resetPassword: '/reset-password',
  privacy: '/privacy',
  account: '/account'
} as const;

const KNOWN_ROUTES: string[] = Object.values(ROUTES);
const PUBLIC_ROUTES: string[] = [
  ROUTES.landing,
  ROUTES.pricing,
  ROUTES.faq,
  ROUTES.setup,
  ROUTES.servers,
  ROUTES.about,
  ROUTES.auth,
  ROUTES.resetPassword,
  ROUTES.privacy
];

const GUEST_ONLY_ROUTES: string[] = [ROUTES.auth];
const INDEXED_ROUTES: string[] = [ROUTES.landing, ROUTES.pricing, ROUTES.faq, ROUTES.setup, ROUTES.servers, ROUTES.about, ROUTES.privacy];

export const isKnownRoute = (pathname: string): boolean => KNOWN_ROUTES.includes(pathname);

export const isPublicRoute = (pathname: string): boolean => PUBLIC_ROUTES.includes(pathname);

export const isGuestOnlyRoute = (pathname: string): boolean => GUEST_ONLY_ROUTES.includes(pathname);

export const indexedRoutes = (): string[] => [...INDEXED_ROUTES];
