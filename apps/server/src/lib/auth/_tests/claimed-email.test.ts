import { describe, expect, it } from 'vitest';

import { claimedEmail } from '../claimed-email';

describe('claimedEmail', () => {
  it('reads the address a sign-up claims', () => {
    expect(claimedEmail({ path: '/sign-up/email', body: { email: 'a@b.c', password: 'x' } })).toBe('a@b.c');
  });

  it('reads the new address of an email change', () => {
    expect(claimedEmail({ path: '/change-email', body: { newEmail: 'n@b.c' } })).toBe('n@b.c');
  });

  it('ignores routes that claim no address', () => {
    expect(claimedEmail({ path: '/sign-in/email', body: { email: 'a@b.c' } })).toBeNull();
  });

  it('ignores a body whose field is not a string', () => {
    expect(claimedEmail({ path: '/sign-up/email', body: { email: { not: '' } } })).toBeNull();
  });

  it('does not treat an inherited key as a guarded path', () => {
    expect(claimedEmail({ path: 'toString', body: { email: 'a@b.c' } })).toBeNull();
  });
});
