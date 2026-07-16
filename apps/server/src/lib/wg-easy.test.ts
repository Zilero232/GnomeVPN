import { afterEach, describe, expect, it, vi } from 'vitest';
import { WgEasyClient } from './wg-easy';

const makeClient = () => new WgEasyClient({ baseUrl: 'http://wg.local', apiKey: 'k' });

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('WgEasyClient', () => {
  it('createClient posts and maps the response', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          id: 'client-1',
          privateKey: 'priv',
          address: '10.8.0.2/32',
          serverPublicKey: 'srvpub',
          dns: '10.8.0.1',
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await makeClient().createClient('user-1');

    expect(result.clientId).toBe('client-1');
    expect(result.privateKey).toBe('priv');
    expect(fetchMock).toHaveBeenCalled();
  });

  it('health returns false on non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 503 })));
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
