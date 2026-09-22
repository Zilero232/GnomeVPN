import { GUEST_ONLY_ROUTES, INDEXED_ROUTES, KNOWN_ROUTES, PUBLIC_ROUTES, ROUTES } from './routes.constants';

export const blogPostRoute = (slug: string): string => `${ROUTES.blog}/${slug}`;

export const isKnownRoute = (pathname: string): boolean => KNOWN_ROUTES.includes(pathname);

export const isPublicRoute = (pathname: string): boolean => PUBLIC_ROUTES.includes(pathname);

export const isGuestOnlyRoute = (pathname: string): boolean => GUEST_ONLY_ROUTES.includes(pathname);

export const indexedRoutes = (): string[] => [...INDEXED_ROUTES];
