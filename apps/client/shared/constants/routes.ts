export const ROUTES = {
  landing: '/',
  auth: '/auth',
  account: '/account',
  app: '/app',
} as const;

const KNOWN_ROUTES: string[] = Object.values(ROUTES);
const PUBLIC_ROUTES: string[] = [ROUTES.landing, ROUTES.auth];
const GUEST_ONLY_ROUTES: string[] = [ROUTES.auth];

export const isKnownRoute = (pathname: string): boolean => {
  return KNOWN_ROUTES.includes(pathname);
};

export const isPublicRoute = (pathname: string): boolean => {
  return PUBLIC_ROUTES.includes(pathname);
};

export const isGuestOnlyRoute = (pathname: string): boolean => {
  return GUEST_ONLY_ROUTES.includes(pathname);
};
