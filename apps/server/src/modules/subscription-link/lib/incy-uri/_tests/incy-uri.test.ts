import type { TunnelConfig } from '@gnomevpn/schemas';

import { TUNNEL_PROTOCOL } from '@gnomevpn/schemas';
import { describe, expect, it } from 'vitest';

import { serverName } from '../../server-name';
import { incyServerUri } from '../incy-uri';

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

describe('incyServerUri', () => {
  it('builds a hy2 link INCY can parse', () => {
    const uri = incyServerUri({ config, country: 'Netherlands', countryCode: 'NL', city: 'Amsterdam' });

    expect(uri.startsWith('hy2://secret-auth@203.0.113.10:443/')).toBe(true);
  });

  it('carries the sni the node presents', () => {
    const uri = incyServerUri({ config, country: 'Netherlands', countryCode: 'NL', city: null });

    expect(new URL(uri).searchParams.get('sni')).toBe(config.serverName);
  });

  it('marks a self-signed node insecure so the client accepts it', () => {
    const uri = incyServerUri({ config, country: 'Netherlands', countryCode: 'NL', city: null });

    expect(new URL(uri).searchParams.get('insecure')).toBe('1');
  });

  it('omits insecure when the node presents a trusted certificate', () => {
    const uri = incyServerUri({ config: { ...config, insecure: false }, country: 'Netherlands', countryCode: 'NL', city: null });

    expect(new URL(uri).searchParams.has('insecure')).toBe(false);
  });

  it('round-trips a credential that contains url metacharacters', () => {
    const uri = incyServerUri({ config: { ...config, auth: 'p@ss:word/x' }, country: 'Netherlands', countryCode: 'NL', city: null });

    expect(decodeURIComponent(new URL(uri).username)).toBe('p@ss:word/x');
  });

  it('names the server in the fragment', () => {
    const uri = incyServerUri({ config, country: 'Netherlands', countryCode: 'NL', city: 'Amsterdam' });

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
    flow: 'xtls-rprx-vision'
  }
};

const vlessParams = (uri: string) => new URL(uri).searchParams;

describe('incyServerUri over vless', () => {
  it('builds a vless link rather than a hy2 one', () => {
    const uri = incyServerUri({ config: vlessConfig, country: 'Netherlands', countryCode: 'NL', city: null });

    expect(uri.startsWith('vless://')).toBe(true);
  });

  it('carries the reality handshake the client cannot derive on its own', () => {
    const params = vlessParams(incyServerUri({ config: vlessConfig, country: 'Netherlands', countryCode: 'NL', city: null }));

    expect(params.get('security')).toBe('reality');
    expect(params.get('pbk')).toBe(vlessConfig.reality?.publicKey);
    expect(params.get('sid')).toBe(vlessConfig.reality?.shortId);
    expect(params.get('fp')).toBe(vlessConfig.reality?.fingerprint);
  });

  it('rides tcp, which is the whole point of offering it beside hysteria2', () => {
    const params = vlessParams(incyServerUri({ config: vlessConfig, country: 'Netherlands', countryCode: 'NL', city: null }));

    expect(params.get('type')).toBe('tcp');
  });

  it('never marks a reality server insecure — it presents a real certificate', () => {
    const params = vlessParams(incyServerUri({ config: vlessConfig, country: 'Netherlands', countryCode: 'NL', city: null }));

    expect(params.has('insecure')).toBe(false);
  });

  it('distinguishes the two entries for one node, so the list is not two identical names', () => {
    const vless = incyServerUri({ config: vlessConfig, country: 'Netherlands', countryCode: 'NL', city: null });
    const hysteria = incyServerUri({ config, country: 'Netherlands', countryCode: 'NL', city: null });

    expect(new URL(vless).hash).not.toBe(new URL(hysteria).hash);
  });

  it('refuses to advertise a server whose node was never given reality keys', () => {
    const { reality, ...withoutReality } = vlessConfig;

    expect(incyServerUri({ config: withoutReality as TunnelConfig, country: 'Netherlands', countryCode: 'NL', city: null })).toBe('');
  });
});

describe('incyServerUri certificate pinning', () => {
  const pinned = { ...config, certFingerprint: 'AA:BB:CC:DD' };

  it('pins the node certificate rather than turning verification off', () => {
    const params = new URL(incyServerUri({ config: pinned, country: 'Netherlands', countryCode: 'NL', city: null })).searchParams;

    expect(params.get('pinSHA256')).toBe(pinned.certFingerprint);
    expect(params.has('insecure')).toBe(false);
  });

  it('falls back to insecure only where no fingerprint was captured', () => {
    const params = new URL(incyServerUri({ config, country: 'Netherlands', countryCode: 'NL', city: null })).searchParams;

    expect(params.get('insecure')).toBe('1');
  });
});
