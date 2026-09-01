import { describe, expect, it } from 'vitest';

import { isAllowedWebhookIp } from '../webhook-ip';

describe('isAllowedWebhookIp', () => {
  it('allows an address inside a yookassa range', () => {
    expect(isAllowedWebhookIp('185.71.76.1')).toBe(true);
  });

  it('allows an address from another yookassa range', () => {
    expect(isAllowedWebhookIp('77.75.153.50')).toBe(true);
  });

  it('allows a single-host yookassa address', () => {
    expect(isAllowedWebhookIp('77.75.156.11')).toBe(true);
  });

  it('allows a yookassa address arriving as an ipv4-mapped ipv6', () => {
    expect(isAllowedWebhookIp('::ffff:185.71.76.1')).toBe(true);
  });

  it('allows an address inside the yookassa ipv6 range', () => {
    expect(isAllowedWebhookIp('2a02:5180::1')).toBe(true);
  });

  it('rejects an address outside every allowed range', () => {
    expect(isAllowedWebhookIp('8.8.8.8')).toBe(false);
  });

  it('rejects an address just past the end of a range', () => {
    expect(isAllowedWebhookIp('185.71.76.32')).toBe(false);
  });

  it('rejects a neighbouring single-host address', () => {
    expect(isAllowedWebhookIp('77.75.156.12')).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(isAllowedWebhookIp('')).toBe(false);
  });

  it('rejects garbage that is not an address', () => {
    expect(isAllowedWebhookIp('not-an-ip')).toBe(false);
  });

  it('rejects an address carrying a port', () => {
    expect(isAllowedWebhookIp('185.71.76.1:443')).toBe(false);
  });
});
