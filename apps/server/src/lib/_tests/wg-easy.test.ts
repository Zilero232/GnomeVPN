import { afterEach, describe, expect, it, vi } from 'vitest';

import { WgEasyClient } from '../wg-easy';

const makeClient = () => new WgEasyClient({ baseUrl: 'http://wg.local', apiKey: 'secret-pass' });

const clientRow = {
  id: 'client-1',
  name: 'user-1',
  address: '10.8.0.2',
  latestHandshakeAt: null as string | null,
};

const configurationIni = `
[Interface]
PrivateKey = aGVsbG8td29ybGQtcHJpdmF0ZS1rZXktdmFsdWU9
Address = 10.8.0.2/24
DNS = 1.1.1.1

[Peer]
PublicKey = c2VydmVyLXB1YmxpYy1rZXktdmFsdWUtaGVyZT0=
PresharedKey = cHJlc2hhcmVkLWtleS12YWx1ZS1nb2VzLWhlcmU9
AllowedIPs = 0.0.0.0/0, ::/0
PersistentKeepalive = 0
Endpoint = 203.0.113.10:51820
`;

const stubWgEasy = (overrides: { rows?: unknown; configuration?: string } = {}) => {
  const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
    const href = url.toString();
    if (href.endsWith('/configuration')) {
      return new Response(overrides.configuration ?? configurationIni, { status: 200 });
    }
    if (href.endsWith('/api/wireguard/client') && init?.method === 'POST') {
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }
    if (href.endsWith('/api/wireguard/client')) {
      return new Response(JSON.stringify(overrides.rows ?? [clientRow]), { status: 200 });
    }
    return new Response('', { status: 404 });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('WgEasyClient', () => {
  it('createClient reads keys from the generated configuration', async () => {
    stubWgEasy();

    const result = await makeClient().createClient('user-1');

    expect(result.clientId).toBe('client-1');
    expect(result.privateKey).toBe('aGVsbG8td29ybGQtcHJpdmF0ZS1rZXktdmFsdWU9');
    expect(result.serverPublicKey).toBe('c2VydmVyLXB1YmxpYy1rZXktdmFsdWUtaGVyZT0=');
    expect(result.address).toBe('10.8.0.2/24');
    expect(result.dns).toBe('1.1.1.1');
  });

  it('sends the password as a bare authorization header', async () => {
    const fetchMock = stubWgEasy();

    await makeClient().createClient('user-1');

    const headers = fetchMock.mock.calls[0]?.[1]?.headers as Record<string, string>;
    expect(headers.Authorization).toBe('secret-pass');
  });

  it('createClient throws when the configuration lacks a private key', async () => {
    stubWgEasy({ configuration: '[Interface]\nAddress = 10.8.0.2/24\n' });

    await expect(makeClient().createClient('user-1')).rejects.toThrow('incomplete configuration');
  });

  it('createClient throws when the created client is missing from the list', async () => {
    stubWgEasy({ rows: [] });

    await expect(makeClient().createClient('user-1')).rejects.toThrow('client not found');
  });

  it('getClientHandshake maps the timestamp from the client list', async () => {
    stubWgEasy({ rows: [{ ...clientRow, latestHandshakeAt: '2026-07-16T10:00:00.000Z' }] });

    const handshake = await makeClient().getClientHandshake('client-1');

    expect(handshake).toEqual(new Date('2026-07-16T10:00:00.000Z'));
  });

  it('getClientHandshake returns null for an unknown client', async () => {
    stubWgEasy();

    expect(await makeClient().getClientHandshake('missing')).toBeNull();
  });

  it('health returns false on non-ok response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('', { status: 503 })),
    );
    expect(await makeClient().health()).toBe(false);
  });

  it('health returns false when fetch throws', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down');
      }),
    );
    expect(await makeClient().health()).toBe(false);
  });
});
