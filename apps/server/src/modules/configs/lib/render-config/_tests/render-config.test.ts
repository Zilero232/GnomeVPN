import type { TunnelConfig } from '@gnomevpn/schemas';

import { TUNNEL_PROTOCOL } from '@gnomevpn/schemas';
import { describe, expect, it } from 'vitest';

import { renderConfig } from '../render-config';

const hysteria2Config: TunnelConfig = {
  auth: 'secret-auth',
  dns: ['1.1.1.1', '8.8.8.8'],
  insecure: true,
  port: 443,
  protocol: TUNNEL_PROTOCOL.hysteria2,
  server: '203.0.113.10',
  serverName: 'cdn.example.com'
};

const wireguardConfig: TunnelConfig = {
  auth: '',
  dns: ['1.1.1.1', '8.8.8.8'],
  insecure: false,
  port: 51820,
  protocol: TUNNEL_PROTOCOL.wireguard,
  server: '203.0.113.10',
  serverName: '',
  wireguard: {
    address: '10.9.0.2/24',
    allowedIps: ['0.0.0.0/0'],
    mtu: 1360,
    peerPublicKey: 'node-public-key',
    privateKey: 'peer-private-key',
    reserved: []
  }
};

const input = { country: 'Netherlands', deviceName: 'My Phone' };

describe('renderConfig', () => {
  it('names a wireguard file with the conf extension', () => {
    expect(renderConfig({ ...input, config: wireguardConfig, protocol: TUNNEL_PROTOCOL.wireguard }).fileName).toBe(
      'GnomeVPN-Netherlands-MyPhone.conf'
    );
  });

  it('renders a wireguard interface and peer block', () => {
    const { content } = renderConfig({ ...input, config: wireguardConfig, protocol: TUNNEL_PROTOCOL.wireguard });

    expect(content).toContain('[Interface]');
    expect(content).toContain('PrivateKey = peer-private-key');
    expect(content).toContain('Address = 10.9.0.2/24');
    expect(content).toContain('[Peer]');
    expect(content).toContain('PublicKey = node-public-key');
    expect(content).toContain('Endpoint = 203.0.113.10:51820');
  });

  it('names a hysteria2 file with the txt extension', () => {
    expect(renderConfig({ ...input, config: hysteria2Config, protocol: TUNNEL_PROTOCOL.hysteria2 }).fileName).toBe(
      'GnomeVPN-Netherlands-MyPhone.txt'
    );
  });

  it('renders a hysteria2 link body', () => {
    const { content } = renderConfig({ ...input, config: hysteria2Config, protocol: TUNNEL_PROTOCOL.hysteria2 });

    expect(content.startsWith('hy2://secret-auth@203.0.113.10:443/')).toBe(true);
    expect(content).toContain('sni=cdn.example.com');
    expect(content).toContain('insecure=1');
  });

  it('falls back to the hysteria2 branch for an unknown protocol', () => {
    const rendered = renderConfig({ ...input, config: hysteria2Config, protocol: 'shadowsocks' as never });

    expect(rendered.fileName).toBe('GnomeVPN-Netherlands-MyPhone.txt');
    expect(rendered.content.startsWith('hy2://')).toBe(true);
  });

  it('falls back to the hysteria2 branch for an unset protocol', () => {
    const rendered = renderConfig({ ...input, config: hysteria2Config, protocol: undefined as never });

    expect(rendered.fileName).toBe('GnomeVPN-Netherlands-MyPhone.txt');
    expect(rendered.content.startsWith('hy2://')).toBe(true);
  });

  it('drops the device segment from the name when there is no device', () => {
    expect(renderConfig({ ...input, config: hysteria2Config, deviceName: '', protocol: TUNNEL_PROTOCOL.hysteria2 }).fileName).toBe(
      'GnomeVPN-Netherlands.txt'
    );
  });
});
