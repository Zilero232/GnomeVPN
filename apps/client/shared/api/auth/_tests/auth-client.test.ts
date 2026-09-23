import { beforeEach, describe, expect, it } from 'vitest';

import { STORAGE_KEYS } from '@/shared/constants';

import { saveAuthToken } from '../auth-client';

describe('saveAuthToken', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('reports a change when the reader is a different one, which is what clears their cache', () => {
    expect(saveAuthToken('first')).toBe(true);
    expect(saveAuthToken('second')).toBe(true);
  });

  it('reports no change when the same token is sent back, so a refresh does not wipe the cache', () => {
    saveAuthToken('same');

    expect(saveAuthToken('same')).toBe(false);
  });

  it('stores what it was given', () => {
    saveAuthToken('written');

    expect(window.localStorage.getItem(STORAGE_KEYS.authToken)).toBe('written');
  });

  it('ignores an absent token rather than clearing the one already held', () => {
    saveAuthToken('kept');

    expect(saveAuthToken(null)).toBe(false);
    expect(window.localStorage.getItem(STORAGE_KEYS.authToken)).toBe('kept');
  });
});
