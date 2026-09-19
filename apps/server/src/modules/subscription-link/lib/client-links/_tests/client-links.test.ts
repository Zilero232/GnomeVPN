import { CLIENT_REGISTRY } from '@gnomevpn/schemas';
import { describe, expect, it } from 'vitest';

import { clientLinks } from '../client-links';

const input = { url: 'https://api.gnomevpn.ru/sub/token?x=1', deepLink: 'incy://crypt1/payload' };

const byId = (id: string) => clientLinks(input).find((client) => client.id === id);

describe('clientLinks', () => {
  it('hands INCY its own deep link rather than a scheme it does not answer', () => {
    expect(byId('incy')?.importUrl).toBe(input.deepLink);
  });

  it('puts the url in the path for hiddify, which reads it raw', () => {
    expect(byId('hiddify')?.importUrl).toBe(`hiddify://import/${input.url}`);
  });

  it('encodes the url for a query-style scheme, whose own separators would otherwise swallow it', () => {
    expect(byId('v2rayng')?.importUrl).toBe(`v2rayng://install-sub?url=${encodeURIComponent(input.url)}`);
    expect(byId('clashMeta')?.importUrl).toBe(`clash://install-config?url=${encodeURIComponent(input.url)}`);
  });

  it('offers no import link for a client with no documented scheme: a made-up one opens nothing', () => {
    expect(byId('streisand')?.importUrl).toBeNull();
    expect(byId('nekobox')?.importUrl).toBeNull();
  });

  it('covers every client the registry knows, so the account page can render them all', () => {
    expect(
      clientLinks(input)
        .map((client) => client.id)
        .sort()
    ).toEqual(Object.keys(CLIENT_REGISTRY).sort());
  });
});
