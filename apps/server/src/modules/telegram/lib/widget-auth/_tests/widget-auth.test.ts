import { createHash, createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import type { WidgetPayload } from '../widget-auth.types';

import { verifyWidgetPayload, widgetIdentity } from '../widget-auth';
import { WIDGET_AUTH } from '../widget-auth.constants';

const BOT_TOKEN = '123456:test-token';
const NOW = new Date('2026-09-22T12:00:00.000Z');

const sign = (payload: WidgetPayload): string => {
  const secret = createHash('sha256').update(BOT_TOKEN).digest();
  const data = Object.entries(payload)
    .filter(([key]) => key !== WIDGET_AUTH.hashField)
    .map(([key, value]) => `${key}=${value}`)
    .sort()
    .join(WIDGET_AUTH.separator);

  return createHmac('sha256', secret).update(data).digest('hex');
};

const signedPayload = (overrides: WidgetPayload = {}): WidgetPayload => {
  const payload = {
    id: '42',
    first_name: 'Test',
    auth_date: String(Math.floor(NOW.getTime() / 1000)),
    ...overrides
  };

  return { ...payload, hash: sign(payload) };
};

describe('verifyWidgetPayload', () => {
  it('accepts a payload Telegram actually signed', () => {
    expect(verifyWidgetPayload({ payload: signedPayload(), botToken: BOT_TOKEN, now: NOW })).toBe(true);
  });

  it('refuses a payload whose field was edited after signing', () => {
    const payload = { ...signedPayload(), id: '43' };

    expect(verifyWidgetPayload({ payload, botToken: BOT_TOKEN, now: NOW })).toBe(false);
  });

  it('refuses a signature made with a different bot token', () => {
    expect(verifyWidgetPayload({ payload: signedPayload(), botToken: 'other-token', now: NOW })).toBe(false);
  });

  it('refuses a payload with no hash at all', () => {
    const { hash, ...unsigned } = signedPayload();

    expect(hash).toBeTruthy();
    expect(verifyWidgetPayload({ payload: unsigned, botToken: BOT_TOKEN, now: NOW })).toBe(false);
  });

  it('refuses a correctly signed payload older than the window, so one cannot be replayed', () => {
    const stale = new Date(NOW.getTime() + (WIDGET_AUTH.maxAgeSeconds + 60) * 1000);

    expect(verifyWidgetPayload({ payload: signedPayload(), botToken: BOT_TOKEN, now: stale })).toBe(false);
  });

  it('refuses a payload dated in the future, which no honest client produces', () => {
    const ahead = new Date(NOW.getTime() - 60_000);

    expect(verifyWidgetPayload({ payload: signedPayload(), botToken: BOT_TOKEN, now: ahead })).toBe(false);
  });

  it('refuses an auth_date that is not a number', () => {
    const payload = signedPayload({ auth_date: 'yesterday' });

    expect(verifyWidgetPayload({ payload, botToken: BOT_TOKEN, now: NOW })).toBe(false);
  });
});

describe('widgetIdentity', () => {
  it('reads the account the payload names', () => {
    expect(widgetIdentity({ id: '42', username: 'someone' })?.telegramId).toBe(42n);
  });

  it('refuses an id that is not a Telegram id, rather than resolving to a shared account', () => {
    expect(widgetIdentity({ id: '' })).toBeNull();
    expect(widgetIdentity({ id: 'abc' })).toBeNull();
    expect(widgetIdentity({})).toBeNull();
  });

  it('treats a missing username as absent rather than empty', () => {
    expect(widgetIdentity({ id: '42' })?.username).toBeNull();
  });
});
