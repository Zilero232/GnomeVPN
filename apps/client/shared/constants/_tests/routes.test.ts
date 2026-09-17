import { describe, expect, it } from 'vitest';

import { isGuestOnlyRoute, isKnownRoute, isPublicRoute, ROUTES } from '../routes';

describe('isKnownRoute', () => {
  it('accepts every declared route', () => {
    expect(Object.values(ROUTES).every(isKnownRoute)).toBe(true);
  });

  it('rejects anything undeclared', () => {
    expect(isKnownRoute('/blog')).toBe(false);
    expect(isKnownRoute('')).toBe(false);
  });

  it('matches exactly, so a subpath is not a known route', () => {
    expect(isKnownRoute('/account/billing')).toBe(false);
  });

  it('matches exactly, so a trailing slash is not a known route', () => {
    expect(isKnownRoute('/account/')).toBe(false);
  });
});

describe('isPublicRoute', () => {
  it('accepts the routes reachable without a session', () => {
    expect(isPublicRoute(ROUTES.landing)).toBe(true);
    expect(isPublicRoute(ROUTES.auth)).toBe(true);
    expect(isPublicRoute(ROUTES.resetPassword)).toBe(true);
    expect(isPublicRoute(ROUTES.privacy)).toBe(true);
  });

  it('rejects the routes behind a session', () => {
    expect(isPublicRoute(ROUTES.account)).toBe(false);
  });

  it('matches exactly, so a subpath of a public route is not public', () => {
    expect(isPublicRoute('/auth/callback')).toBe(false);
    expect(isPublicRoute('/privacy/')).toBe(false);
  });
});

describe('isGuestOnlyRoute', () => {
  it('accepts only the auth route', () => {
    expect(isGuestOnlyRoute(ROUTES.auth)).toBe(true);
    expect(isGuestOnlyRoute(ROUTES.landing)).toBe(false);
    expect(isGuestOnlyRoute(ROUTES.account)).toBe(false);
  });

  it('matches exactly, so a subpath of auth is not guest-only', () => {
    expect(isGuestOnlyRoute('/auth/sign-in')).toBe(false);
    expect(isGuestOnlyRoute('/auth/')).toBe(false);
  });
});
