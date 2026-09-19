import type { TunnelConfig } from '@gnomevpn/schemas';

import { TUNNEL_PROTOCOL } from '@gnomevpn/schemas';
import { isNullish } from 'remeda';
import { describe, expect, it } from 'vitest';

import { serverName } from '../../server-name';
import { HYSTERIA2_SCHEME } from '../hysteria2/hysteria2.constants';
import { incyServerUri } from '../incy-uri';
import { VLESS_NETWORK } from '../vless/vless.constants';

const config: TunnelConfig = {
  auth: 'secret-auth',
  dns: ['1.1.1.1'],
  insecure: true,
  certFingerprint: '',
  port: 443,
  protocol: TUNNEL_PROTOCOL.hysteria2,
  server: '203.0.113.10',
  serverName: 'cdn.example.com'
};

const uriOf = (input: Parameters<typeof incyServerUri>[0]): string => {
  const uri = incyServerUri(input);

  if (isNullish(uri)) {
    throw new Error('expected a uri');
  }

  return uri;
};

describe('incyServerUri', () => {
  it('builds a hysteria2 link INCY can parse', () => {
    const uri = uriOf({ config, country: 'Netherlands', countryCode: 'NL', city: 'Amsterdam' });

    expect(uri.startsWith(`${HYSTERIA2_SCHEME}://secret-auth@203.0.113.10:443/`)).toBe(true);
  });

  it('carries the sni the node presents', () => {
    const uri = uriOf({ config, country: 'Netherlands', countryCode: 'NL', city: null });

    expect(new URL(uri).searchParams.get('sni')).toBe(config.serverName);
  });

  it('marks a self-signed node insecure so the client accepts it', () => {
    const uri = uriOf({ config, country: 'Netherlands', countryCode: 'NL', city: null });

    expect(new URL(uri).searchParams.get('insecure')).toBe('1');
  });

  it('omits insecure when the node presents a trusted certificate', () => {
    const uri = uriOf({ config: { ...config, insecure: false }, country: 'Netherlands', countryCode: 'NL', city: null });

    expect(new URL(uri).searchParams.has('insecure')).toBe(false);
  });

  it('round-trips a credential that contains url metacharacters', () => {
    const uri = uriOf({ config: { ...config, auth: 'p@ss:word/x' }, country: 'Netherlands', countryCode: 'NL', city: null });

    expect(decodeURIComponent(new URL(uri).username)).toBe('p@ss:word/x');
  });

  it('names the server in the fragment', () => {
    const uri = uriOf({ config, country: 'Netherlands', countryCode: 'NL', city: 'Amsterdam' });

    expect(decodeURIComponent(new URL(uri).hash)).toBe(`#${serverName({ country: 'Netherlands', countryCode: 'NL', city: 'Amsterdam' })}`);
  });
});

const vlessConfig: TunnelConfig = {
  auth: '0f1e2d3c-4b5a-6978-8796-a5b4c3d2e1f0',
  dns: ['1.1.1.1'],
  insecure: false,
  certFingerprint: '',
  port: 443,
  protocol: TUNNEL_PROTOCOL.vless,
  server: '203.0.113.10',
  serverName: 'www.bing.com',
  reality: {
    publicKey: 'node-reality-public-key',
    shortId: 'aabbccdd',
    fingerprint: 'chrome',
    flow: '',
    serviceName: 'grpc'
  }
};

const vlessParams = (uri: string) => new URL(uri).searchParams;

describe('incyServerUri over vless', () => {
  it('builds a vless link rather than a hysteria2 one', () => {
    const uri = uriOf({ config: vlessConfig, country: 'Netherlands', countryCode: 'NL', city: null });

    expect(uri.startsWith('vless://')).toBe(true);
  });

  it('carries the reality handshake the client cannot derive on its own', () => {
    const params = vlessParams(uriOf({ config: vlessConfig, country: 'Netherlands', countryCode: 'NL', city: null }));

    expect(params.get('security')).toBe('reality');
    expect(params.get('pbk')).toBe(vlessConfig.reality?.publicKey);
    expect(params.get('sid')).toBe(vlessConfig.reality?.shortId);
    expect(params.get('fp')).toBe(vlessConfig.reality?.fingerprint);
  });

  it('rides tcp, which is the whole point of offering it beside hysteria2', () => {
    const params = vlessParams(uriOf({ config: vlessConfig, country: 'Netherlands', countryCode: 'NL', city: null }));

    expect(params.get('type')).toBe(VLESS_NETWORK);
  });

  it('names the grpc service, without which the client reaches no inbound', () => {
    const params = vlessParams(uriOf({ config: vlessConfig, country: 'Netherlands', countryCode: 'NL', city: null }));

    expect(params.get('serviceName')).toBe(vlessConfig.reality?.serviceName);
  });

  it('carries no flow: a raw-tcp flow on a grpc stream is refused by the core', () => {
    const params = vlessParams(uriOf({ config: vlessConfig, country: 'Netherlands', countryCode: 'NL', city: null }));

    expect(params.has('flow')).toBe(false);
  });

  it('never marks a reality server insecure — it presents a real certificate', () => {
    const params = vlessParams(uriOf({ config: vlessConfig, country: 'Netherlands', countryCode: 'NL', city: null }));

    expect(params.has('insecure')).toBe(false);
  });

  it('leaves the name free of transport labels, which the client renders from the uri itself', () => {
    const vless = uriOf({ config: vlessConfig, country: 'Netherlands', countryCode: 'NL', city: null });

    expect(decodeURIComponent(new URL(vless).hash)).toBe(`#${serverName({ country: 'Netherlands', countryCode: 'NL', city: null })}`);
  });

  it('refuses to advertise a server whose node was never given reality keys', () => {
    const { reality, ...withoutReality } = vlessConfig;

    expect(incyServerUri({ config: withoutReality as TunnelConfig, country: 'Netherlands', countryCode: 'NL', city: null })).toBeNull();
  });
});

describe('incyServerUri certificate pinning', () => {
  const digest = 'a'.repeat(64);
  const opensslFormat = (digest.match(/.{2}/g) ?? []).join(':').toUpperCase();
  const pinned = { ...config, certFingerprint: opensslFormat };

  it('pins the node certificate rather than turning verification off', () => {
    const params = new URL(uriOf({ config: pinned, country: 'Netherlands', countryCode: 'NL', city: null })).searchParams;

    expect(params.get('pinSHA256')).toBe(digest);
    expect(params.has('insecure')).toBe(false);
  });

  it('normalises what openssl prints, which a core comparing the pin as a string cannot match', () => {
    const params = new URL(uriOf({ config: pinned, country: 'Netherlands', countryCode: 'NL', city: null })).searchParams;

    expect(params.get('pinSHA256')).not.toBe(opensslFormat);
  });

  it('falls back to the insecure flag when the stored fingerprint is not a sha-256', () => {
    const malformed = { ...config, certFingerprint: 'AA:BB:CC' };
    const params = new URL(uriOf({ config: malformed, country: 'Netherlands', countryCode: 'NL', city: null })).searchParams;

    expect(params.has('pinSHA256')).toBe(false);
    expect(params.get('insecure')).toBe('1');
  });

  it('falls back to insecure only where no fingerprint was captured', () => {
    const params = new URL(uriOf({ config, country: 'Netherlands', countryCode: 'NL', city: null })).searchParams;

    expect(params.get('insecure')).toBe('1');
  });
});
