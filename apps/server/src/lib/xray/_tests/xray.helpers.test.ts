import { describe, expect, it } from 'vitest';

import type { XrayInbound } from '../inbounds';

import { AUTH_BYTES } from '../xray.constants';
import {
  currentClients,
  generateAuth,
  parseSettings,
  parseSniffing,
  parseStreamSettings,
  parseWireguardSettings,
  stripCidrMask
} from '../xray.helpers';

const inbound = (patch: Partial<XrayInbound>): XrayInbound => ({
  id: 1,
  enable: true,
  remark: 'test',
  port: 443,
  settings: '{}',
  ...patch
});

describe('stripCidrMask', () => {
  it('strips a trailing mask from an ipv4 address', () => {
    expect(stripCidrMask('10.9.0.2/24')).toBe('10.9.0.2');
  });

  it('leaves a plain address alone', () => {
    expect(stripCidrMask('10.9.0.2')).toBe('10.9.0.2');
  });

  it('strips a trailing mask from an ipv6 address', () => {
    expect(stripCidrMask('2a02:5180::1/32')).toBe('2a02:5180::1');
  });

  it('leaves a plain ipv6 address alone', () => {
    expect(stripCidrMask('2a02:5180::1')).toBe('2a02:5180::1');
  });

  it('strips only the last mask of a comma joined list', () => {
    expect(stripCidrMask('10.9.0.2/24,10.9.0.3/24')).toBe('10.9.0.2/24,10.9.0.3');
  });
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

describe('parseWireguardSettings', () => {
  it('parses a json string', () => {
    expect(parseWireguardSettings(inbound({ settings: '{"secretKey":"key","mtu":1360}' }))).toEqual({ mtu: 1360, secretKey: 'key' });
  });

  it('passes an already parsed object through', () => {
    const settings = { mtu: 1360, secretKey: 'key' };

    expect(parseWireguardSettings(inbound({ settings }))).toBe(settings);
  });

  it('returns an empty object for undefined settings', () => {
    expect(parseWireguardSettings(inbound({ settings: undefined as unknown as string }))).toEqual({});
  });

  it('returns an empty object for malformed json', () => {
    expect(parseWireguardSettings(inbound({ settings: '{"secretKey":' }))).toEqual({});
  });
});

describe('currentClients', () => {
  it('returns the clients array', () => {
    expect(currentClients(inbound({ settings: '{"clients":[{"email":"a"},{"email":"b"}]}' }))).toEqual([{ email: 'a' }, { email: 'b' }]);
  });

  it('returns an empty array when settings carry no clients', () => {
    expect(currentClients(inbound({ settings: '{"secretKey":"key"}' }))).toEqual([]);
  });

  it('returns an empty array for malformed settings', () => {
    expect(currentClients(inbound({ settings: '{{{' }))).toEqual([]);
  });

  it('returns an empty array when clients is null', () => {
    expect(currentClients(inbound({ settings: '{"clients":null}' }))).toEqual([]);
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
