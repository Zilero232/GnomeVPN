import { describe, expect, it } from 'vitest';

import { isGuestOnlyRoute, isKnownRoute, isPublicRoute, isWebOnlyRoute, ROUTES } from '../routes';

describe('isKnownRoute', () => {
  it('accepts every declared route', () => {
    expect(Object.values(ROUTES).every(isKnownRoute)).toBe(true);
  });

  it('rejects anything undeclared', () => {
    expect(isKnownRoute('/pricing')).toBe(false);
    expect(isKnownRoute('')).toBe(false);
  });

  it('matches exactly, so a subpath is not a known route', () => {
    expect(isKnownRoute('/account/billing')).toBe(false);
  });

  it('matches exactly, so a trailing slash is not a known route', () => {
    expect(isKnownRoute('/app/')).toBe(false);
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
    expect(isPublicRoute(ROUTES.app)).toBe(false);
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

describe('isWebOnlyRoute', () => {
  it('accepts only the landing route', () => {
    expect(isWebOnlyRoute(ROUTES.landing)).toBe(true);
    expect(isWebOnlyRoute(ROUTES.privacy)).toBe(false);
    expect(isWebOnlyRoute(ROUTES.app)).toBe(false);
  });

  it('matches exactly, so any other path is not web-only', () => {
    expect(isWebOnlyRoute('')).toBe(false);
    expect(isWebOnlyRoute('//')).toBe(false);
  });
});
