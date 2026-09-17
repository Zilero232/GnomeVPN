import { describe, expect, it } from 'vitest';

import type { XrayInbound } from '../inbounds';

import { AUTH_BYTES } from '../xray.constants';
import { generateAuth, parseSettings, parseSniffing, parseStreamSettings, readClients, readSettings } from '../xray.helpers';

const inbound = (patch: Partial<XrayInbound>): XrayInbound => ({
  id: 1,
  enable: true,
  remark: 'test',
  port: 443,
  settings: '{}',
  ...patch
});

describe('parseSettings', () => {
  it('parses a json string', () => {
    expect(parseSettings(inbound({ settings: '{"clients":[{"email":"a"}]}' }))).toEqual({ clients: [{ email: 'a' }] });
  });

  it('passes an already parsed object through', () => {
    const settings = { clients: [{ email: 'a' }] };

    expect(parseSettings(inbound({ settings }))).toBe(settings);
  });

  it('returns an empty object for undefined settings', () => {
    expect(parseSettings(inbound({ settings: undefined as unknown as string }))).toEqual({});
  });

  it('returns an empty object for malformed json', () => {
    expect(parseSettings(inbound({ settings: '{not json' }))).toEqual({});
  });
});

describe('parseStreamSettings', () => {
  it('parses a json string', () => {
    expect(parseStreamSettings(inbound({ streamSettings: '{"security":"tls"}' }))).toEqual({ security: 'tls' });
  });

  it('passes an already parsed object through', () => {
    const streamSettings = { security: 'tls' };

    expect(parseStreamSettings(inbound({ streamSettings }))).toBe(streamSettings);
  });

  it('returns an empty object when stream settings are absent', () => {
    expect(parseStreamSettings(inbound({}))).toEqual({});
  });

  it('returns an empty object for malformed json', () => {
    expect(parseStreamSettings(inbound({ streamSettings: '[' }))).toEqual({});
  });
});

describe('parseSniffing', () => {
  it('parses a json string', () => {
    expect(parseSniffing(inbound({ sniffing: '{"enabled":true}' }))).toEqual({ enabled: true });
  });

  it('passes an already parsed object through', () => {
    const sniffing = { enabled: true };

    expect(parseSniffing(inbound({ sniffing }))).toBe(sniffing);
  });

  it('returns an empty object when sniffing is absent', () => {
    expect(parseSniffing(inbound({}))).toEqual({});
  });

  it('returns an empty object for malformed json', () => {
    expect(parseSniffing(inbound({ sniffing: 'null,' }))).toEqual({});
  });
});

describe('generateAuth', () => {
  it('returns a lowercase hex string', () => {
    expect(generateAuth()).toMatch(/^[\da-f]+$/);
  });

  it('returns two hex characters per configured byte', () => {
    expect(generateAuth()).toHaveLength(AUTH_BYTES * 2);
  });

  it('returns a different value on every call', () => {
    expect(generateAuth()).not.toBe(generateAuth());
  });
});

describe('readClients', () => {
  it('reads the client list out of a settings string', () => {
    expect(readClients(inbound({ settings: '{"clients":[{"email":"a"},{"email":"b"}]}' }))).toEqual([{ email: 'a' }, { email: 'b' }]);
  });

  it('reads the client list out of an already parsed object', () => {
    const clients = [{ email: 'a' }];

    expect(readClients(inbound({ settings: { clients } }))).toBe(clients);
  });

  it('reports an empty node as empty, not as unreadable', () => {
    expect(readClients(inbound({ settings: '{"clients":[]}' }))).toEqual([]);
  });

  it('treats settings with no clients key as read, holding nothing', () => {
    expect(readClients(inbound({ settings: '{"secretKey":"key"}' }))).toEqual([]);
  });

  it('refuses to guess at malformed settings, where a tolerant parse would answer an empty list', () => {
    const broken = inbound({ settings: '{not json' });

    expect(parseSettings(broken).clients ?? []).toEqual([]);
    expect(readClients(broken)).toBeNull();
  });

  it('refuses to guess when settings are absent altogether', () => {
    expect(readClients(inbound({ settings: undefined as unknown as string }))).toBeNull();
  });
});

describe('readSettings', () => {
  it('parses a settings string', () => {
    expect(readSettings(inbound({ settings: '{"secretKey":"key","mtu":1360}' }))).toEqual({ mtu: 1360, secretKey: 'key' });
  });

  it('passes an already parsed object through', () => {
    const settings = { secretKey: 'key' };

    expect(readSettings(inbound({ settings }))).toBe(settings);
  });

  it('refuses to guess at malformed settings, where parseSettings would answer an empty object', () => {
    const broken = inbound({ settings: '{"clients":' });

    expect(parseSettings(broken)).toEqual({});
    expect(readSettings(broken)).toBeNull();
  });

  it('refuses to guess when settings are absent', () => {
    expect(readSettings(inbound({ settings: undefined as unknown as string }))).toBeNull();
  });

  it('reports genuinely empty settings as empty rather than unreadable', () => {
    expect(readSettings(inbound({ settings: '{}' }))).toEqual({});
  });
});
