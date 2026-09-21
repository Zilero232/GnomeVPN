import { describe, expect, it } from 'vitest';

import { WEBHOOK } from '../../../config';
import { webhookUrl } from '../webhook-url';

const served = `/${WEBHOOK.path}`;

describe('webhookUrl', () => {
  it('points at the path the controller serves', () => {
    expect(new URL(webhookUrl('https://bot.gnome-vpn.com')).pathname).toBe(served);
  });

  it('lands on the same path whatever the base carries after the host', () => {
    for (const base of ['https://bot.gnome-vpn.com/', 'https://bot.gnome-vpn.com/prefix', 'https://bot.gnome-vpn.com/prefix/']) {
      expect(new URL(webhookUrl(base)).pathname).toBe(served);
    }
  });

  it('keeps the host it was given', () => {
    expect(new URL(webhookUrl('https://bot.gnome-vpn.com/anything')).host).toBe('bot.gnome-vpn.com');
  });
});
