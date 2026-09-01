import { describe, expect, it } from 'vitest';

import { tunnelConfigSchema } from '../outputs';

const hysteria2Config = {
  server: 'node.example.com',
  port: 443,
  auth: 'secret',
  serverName: 'node.example.com',
  dns: ['1.1.1.1']
};

const wireguardConfig = {
  protocol: 'wireguard',
  server: 'node.example.com',
  port: 51820,
  dns: ['1.1.1.1'],
  wireguard: {
    privateKey: 'private',
    address: '10.0.0.2/32',
    peerPublicKey: 'peer'
  }
};

describe('tunnelConfigSchema', () => {
  it('fills in the protocol, credentials and tls defaults', () => {
    const result = tunnelConfigSchema.parse({ server: 'node.example.com', port: 443, auth: 'secret', serverName: 'sni', dns: ['1.1.1.1'] });

    expect(result).toMatchObject({ protocol: 'hysteria2', insecure: false });
  });

  it('defaults auth and serverName to empty strings for wireguard', () => {
    const result = tunnelConfigSchema.parse(wireguardConfig);

    expect(result).toMatchObject({ auth: '', serverName: '' });
  });

  it('defaults the wireguard allowed ips to the whole internet', () => {
    const result = tunnelConfigSchema.parse(wireguardConfig);

    expect(result.wireguard).toMatchObject({ allowedIps: ['0.0.0.0/0'], reserved: [] });
  });

  it('accepts a hysteria2 config carrying both auth and serverName', () => {
    expect(tunnelConfigSchema.safeParse(hysteria2Config).success).toBe(true);
  });

  it('rejects a hysteria2 config without auth', () => {
    const result = tunnelConfigSchema.safeParse({ ...hysteria2Config, auth: '' });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('validation.tunnelProtocolFields');
  });

  it('rejects a hysteria2 config without a serverName', () => {
    const result = tunnelConfigSchema.safeParse({ ...hysteria2Config, serverName: '' });

    expect(result.success).toBe(false);
  });

  it('rejects a hysteria2 config leaving both to their defaults', () => {
    const result = tunnelConfigSchema.safeParse({ server: 'node.example.com', port: 443, dns: ['1.1.1.1'] });

    expect(result.success).toBe(false);
  });

  it('accepts a wireguard config carrying the wireguard block', () => {
    expect(tunnelConfigSchema.safeParse(wireguardConfig).success).toBe(true);
  });

  it('rejects a wireguard config without the wireguard block', () => {
    const result = tunnelConfigSchema.safeParse({ protocol: 'wireguard', server: 'node.example.com', port: 51820, dns: ['1.1.1.1'] });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('validation.tunnelProtocolFields');
  });

  it('ignores the hysteria2 credentials when the protocol is wireguard', () => {
    const result = tunnelConfigSchema.safeParse({ ...wireguardConfig, auth: '', serverName: '' });

    expect(result.success).toBe(true);
  });
});
