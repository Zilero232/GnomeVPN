import { describe, expect, it } from 'vitest';

import { WEBHOOK } from '../../../config';
import { webhookUrl } from '../webhook-url';

const secret = 'a-secret';

describe('webhookUrl', () => {
  it('points at the path the controller serves', () => {
    expect(webhookUrl({ apiUrl: 'https://api.gnome-vpn.com', secret })).toBe(`https://api.gnome-vpn.com/${WEBHOOK.path}`);
  });

  it('does not double the separator when the base ends in one', () => {
    const withSlash = webhookUrl({ apiUrl: 'https://api.gnome-vpn.com/', secret });

    expect(withSlash).toBe(webhookUrl({ apiUrl: 'https://api.gnome-vpn.com', secret }));
    expect(withSlash).not.toContain('//telegram');
  });

  it('refuses a base Telegram would reject', () => {
    expect(webhookUrl({ apiUrl: 'http://localhost:4000', secret })).toBeNull();
    expect(webhookUrl({ apiUrl: 'http://api.gnome-vpn.com', secret })).toBeNull();
  });

  it('refuses to register without a secret, which would leave the route open', () => {
    expect(webhookUrl({ apiUrl: 'https://api.gnome-vpn.com', secret: '' })).toBeNull();
  });
});
