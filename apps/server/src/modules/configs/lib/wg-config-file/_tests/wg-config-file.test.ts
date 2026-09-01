import type { TunnelConfig } from '@gnomevpn/schemas';

import { describe, expect, it } from 'vitest';

import { renderWireguardConfigFile } from '../wg-config-file';

const baseConfig: TunnelConfig = {
  protocol: 'wireguard',
  server: '203.0.113.10',
  port: 51820,
  auth: '',
  serverName: '',
  insecure: false,
  dns: ['1.1.1.1', '8.8.8.8'],
  wireguard: {
    privateKey: 'client-private-key',
    address: '10.9.0.2/24',
    peerPublicKey: 'server-public-key',
    allowedIps: ['0.0.0.0/0', '::/0'],
    reserved: [],
    mtu: 1360
  }
};

describe('renderWireguardConfigFile', () => {
  it('throws when the config carries no wireguard settings', () => {
    expect(() => renderWireguardConfigFile({ config: { ...baseConfig, wireguard: undefined } })).toThrow(
      'renderWireguardConfigFile called without wireguard settings'
    );
  });

  it('renders the interface and peer blocks separated by a blank line', () => {
    expect(renderWireguardConfigFile({ config: baseConfig })).toBe(
      [
        '[Interface]',
        'PrivateKey = client-private-key',
        'Address = 10.9.0.2/24',
        'DNS = 1.1.1.1, 8.8.8.8',
        'MTU = 1360',
        '',
        '[Peer]',
        'PublicKey = server-public-key',
        'Endpoint = 203.0.113.10:51820',
        'AllowedIPs = 0.0.0.0/0, ::/0',
        'PersistentKeepalive = 25',
        ''
      ].join('\n')
    );
  });

  it('includes the mtu line when the mtu is set', () => {
    expect(renderWireguardConfigFile({ config: baseConfig })).toContain('MTU = 1360');
  });

  it('omits the mtu line when the mtu is undefined', () => {
    const result = renderWireguardConfigFile({
      config: { ...baseConfig, wireguard: { ...baseConfig.wireguard!, mtu: undefined } }
    });

    expect(result).not.toContain('MTU');
  });

  it('omits the mtu line when the mtu is zero', () => {
    const result = renderWireguardConfigFile({
      config: { ...baseConfig, wireguard: { ...baseConfig.wireguard!, mtu: 0 } }
    });

    expect(result).not.toContain('MTU');
  });

  it('joins the dns servers with a comma and a space', () => {
    expect(renderWireguardConfigFile({ config: baseConfig })).toContain('DNS = 1.1.1.1, 8.8.8.8');
  });

  it('joins the allowed ips with a comma and a space', () => {
    expect(renderWireguardConfigFile({ config: baseConfig })).toContain('AllowedIPs = 0.0.0.0/0, ::/0');
  });

  it('builds the endpoint from the server and the port', () => {
    expect(renderWireguardConfigFile({ config: baseConfig })).toContain('Endpoint = 203.0.113.10:51820');
  });

  it('ends the rendered file with a newline', () => {
    expect(renderWireguardConfigFile({ config: baseConfig }).endsWith('\n')).toBe(true);
  });
});
