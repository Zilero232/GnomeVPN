import { describe, expect, it } from 'vitest';

import { generateSubscriptionToken } from '../subscription-token';
import { TOKEN_BYTES } from '../subscription-token.constants';

describe('generateSubscriptionToken', () => {
  it('carries the full entropy the config asks for', () => {
    expect(Buffer.from(generateSubscriptionToken(), 'base64url')).toHaveLength(TOKEN_BYTES);
  });

  it('stays url-safe, since the token is the url', () => {
    const token = generateSubscriptionToken();

    expect(encodeURIComponent(token)).toBe(token);
  });

  it('never repeats, which is what makes the link a credential', () => {
    const tokens = Array.from({ length: 200 }, generateSubscriptionToken);

    expect(new Set(tokens).size).toBe(tokens.length);
  });
});
