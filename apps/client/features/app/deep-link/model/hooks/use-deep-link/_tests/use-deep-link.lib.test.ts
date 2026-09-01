import { describe, expect, it } from 'vitest';

import { ROUTES } from '@/shared/constants';

import { routeForDeepLink } from '../use-deep-link.lib';

describe('routeForDeepLink', () => {
  it('returns null when there is nothing to route', () => {
    expect(routeForDeepLink(null)).toBeNull();
    expect(routeForDeepLink([])).toBeNull();
    expect(routeForDeepLink([''])).toBeNull();
  });

  it('returns null for a malformed url', () => {
    expect(routeForDeepLink(['not a url'])).toBeNull();
    expect(routeForDeepLink(['///'])).toBeNull();
  });

  it('returns null for an unknown host', () => {
    expect(routeForDeepLink(['gnomevpn://settings'])).toBeNull();
    expect(routeForDeepLink(['gnomevpn://billing/checkout'])).toBeNull();
  });

  it('maps a known host to its route', () => {
    expect(routeForDeepLink(['gnomevpn://account'])).toBe(ROUTES.account);
    expect(routeForDeepLink(['gnomevpn://app'])).toBe(ROUTES.app);
    expect(routeForDeepLink(['gnomevpn://app/connect?node=de'])).toBe(ROUTES.app);
  });

  it('reads only the first url', () => {
    expect(routeForDeepLink(['gnomevpn://account', 'gnomevpn://app'])).toBe(ROUTES.account);
    expect(routeForDeepLink(['', 'gnomevpn://app'])).toBeNull();
  });
});
