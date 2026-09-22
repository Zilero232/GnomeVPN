import { describe, expect, it } from 'vitest';

import { avatarSeed } from '../avatar-seed';

describe('avatarSeed', () => {
  it('answers the same for the same address, so the avatar does not change between visits', () => {
    expect(avatarSeed('someone@example.com')).toBe(avatarSeed('someone@example.com'));
  });

  it('ignores case and padding, because a mailbox does not care about either', () => {
    expect(avatarSeed(' Someone@Example.com ')).toBe(avatarSeed('someone@example.com'));
  });

  it('tells two addresses apart', () => {
    expect(avatarSeed('a@example.com')).not.toBe(avatarSeed('b@example.com'));
  });

  it('never carries the address itself, which is what would leak it into the markup', () => {
    const seed = avatarSeed('someone@example.com');

    expect(seed).not.toContain('someone');
    expect(seed).not.toContain('@');
  });
});
