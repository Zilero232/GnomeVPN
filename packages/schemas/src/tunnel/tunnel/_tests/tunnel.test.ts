import { describe, expect, it } from 'vitest';

import { tunnelConfigSchema } from '../tunnel.schemas';

const hysteria2Config = {
  server: 'node.example.com',
  port: 443,
  auth: 'secret',
  serverName: 'node.example.com',
  dns: ['1.1.1.1']
};

describe('tunnelConfigSchema', () => {
  it('fills in the protocol, credentials and tls defaults', () => {
    const result = tunnelConfigSchema.parse({ server: 'node.example.com', port: 443, auth: 'secret', serverName: 'sni', dns: ['1.1.1.1'] });

    expect(result).toMatchObject({ protocol: 'hysteria2', insecure: false });
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
});
