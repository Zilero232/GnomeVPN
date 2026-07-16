import { afterEach, describe, expect, it, mock } from 'bun:test';
import { WgEasyClient } from './wg-easy';

const makeClient = () => new WgEasyClient({ baseUrl: 'http://wg.local', apiKey: 'k' });

afterEach(() => {
  mock.restore();
});

describe('WgEasyClient', () => {
  it('createClient posts and maps the response', async () => {
    const fetchMock = mock(async () =>
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
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const result = await makeClient().createClient('user-1');

    expect(result.clientId).toBe('client-1');
    expect(result.privateKey).toBe('priv');
    expect(fetchMock).toHaveBeenCalled();
  });

  it('health returns false on non-ok response', async () => {
    globalThis.fetch = mock(async () => new Response('', { status: 503 })) as unknown as typeof fetch;
    expect(await makeClient().health()).toBe(false);
  });

  it('health returns false when fetch throws', async () => {
    globalThis.fetch = mock(async () => {
      throw new Error('network down');
    }) as unknown as typeof fetch;
    expect(await makeClient().health()).toBe(false);
  });
});
