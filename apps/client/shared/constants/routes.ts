export const ROUTES = {
  landing: '/',
  auth: '/auth',
  resetPassword: '/reset-password',
  privacy: '/privacy',
  account: '/account',
  app: '/app',
} as const;

export const DOWNLOAD_HASH = '#download';

const KNOWN_ROUTES: string[] = Object.values(ROUTES);
const PUBLIC_ROUTES: string[] = [ROUTES.landing, ROUTES.auth, ROUTES.resetPassword, ROUTES.privacy];
const GUEST_ONLY_ROUTES: string[] = [ROUTES.auth];
const WEB_ONLY_ROUTES: string[] = [ROUTES.landing];

export const isKnownRoute = (pathname: string): boolean => {
  return KNOWN_ROUTES.includes(pathname);
};

export const isPublicRoute = (pathname: string): boolean => {
  return PUBLIC_ROUTES.includes(pathname);
};

export const isGuestOnlyRoute = (pathname: string): boolean => {
  return GUEST_ONLY_ROUTES.includes(pathname);
};

export const isWebOnlyRoute = (pathname: string): boolean => {
  return WEB_ONLY_ROUTES.includes(pathname);
};
