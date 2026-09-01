import { TUNNEL_PROTOCOL } from '@gnomevpn/schemas';
import { describe, expect, it } from 'vitest';

import type { TunnelNode } from '../build-config.types';

import { AppServiceUnavailableException } from '../../../../../common/exceptions';
import { WG } from '../../../config';
import { buildTunnelConfig } from '../build-config';

const node: TunnelNode = {
  host: '203.0.113.10',
  port: 443,
  serverName: 'cdn.example.com',
  wgPublicKey: 'node-public-key'
};

const wgInput = {
  auth: 'secret-auth',
  node,
  protocol: TUNNEL_PROTOCOL.wireguard,
  wgAssignedIp: '10.9.0.2',
  wgPrivateKey: 'peer-private-key'
};

describe('buildTunnelConfig', () => {
  it('builds a hysteria2 config from the node endpoint', () => {
    expect(buildTunnelConfig({ auth: 'secret-auth', node, protocol: TUNNEL_PROTOCOL.hysteria2 })).toEqual({
      auth: 'secret-auth',
      dns: ['1.1.1.1', '8.8.8.8'],
      insecure: true,
      port: 443,
      protocol: TUNNEL_PROTOCOL.hysteria2,
      server: '203.0.113.10',
      serverName: 'cdn.example.com'
    });
  });

  it('carries no wireguard block on the hysteria2 branch', () => {
    expect(buildTunnelConfig({ auth: 'secret-auth', node, protocol: TUNNEL_PROTOCOL.hysteria2 })).not.toHaveProperty('wireguard');
  });

  it('builds a wireguard config from the node and the peer keys', () => {
    expect(buildTunnelConfig(wgInput)).toEqual({
      auth: '',
      dns: ['1.1.1.1', '8.8.8.8'],
      insecure: false,
      port: WG.listenPort,
      protocol: TUNNEL_PROTOCOL.wireguard,
      server: '203.0.113.10',
      serverName: '',
      wireguard: {
        address: `10.9.0.2/${WG.addressPrefix}`,
        allowedIps: ['0.0.0.0/0'],
        mtu: WG.mtu,
        peerPublicKey: 'node-public-key',
        privateKey: 'peer-private-key',
        reserved: []
      }
    });
  });

  it('overrides the node port with the wireguard listen port', () => {
    expect(buildTunnelConfig(wgInput).port).toBe(WG.listenPort);
    expect(buildTunnelConfig(wgInput).port).not.toBe(node.port);
  });

  it('blanks auth and the server name on the wireguard branch', () => {
    const config = buildTunnelConfig(wgInput);

    expect(config.auth).toBe('');
    expect(config.serverName).toBe('');
  });

  it('builds the address from the assigned ip and the configured prefix', () => {
    expect(buildTunnelConfig({ ...wgInput, wgAssignedIp: '10.9.0.42' }).wireguard?.address).toBe(`10.9.0.42/${WG.addressPrefix}`);
  });

  it('rejects a wireguard config when the node has no public key', () => {
    expect(() => buildTunnelConfig({ ...wgInput, node: { ...node, wgPublicKey: null } })).toThrow(AppServiceUnavailableException);
  });

  it('rejects a wireguard config when the peer has no private key', () => {
    expect(() => buildTunnelConfig({ ...wgInput, wgPrivateKey: undefined })).toThrow(AppServiceUnavailableException);
  });

  it('rejects a wireguard config when the peer has no assigned ip', () => {
    expect(() => buildTunnelConfig({ ...wgInput, wgAssignedIp: undefined })).toThrow(AppServiceUnavailableException);
  });

  it('reports the node as unavailable when the wireguard endpoint is incomplete', () => {
    expect(() => buildTunnelConfig({ ...wgInput, wgPrivateKey: undefined })).toThrow(
      expect.objectContaining({ response: { code: 'NODE_UNAVAILABLE', error: 'node has no wireguard endpoint' } })
    );
  });

  it('falls back to hysteria2 for an unknown protocol', () => {
    expect(buildTunnelConfig({ auth: 'secret-auth', node, protocol: 'shadowsocks' as never }).protocol).toBe(TUNNEL_PROTOCOL.hysteria2);
  });

  it('does not leak dns mutations back into the shared config', () => {
    const first = buildTunnelConfig({ auth: 'secret-auth', node, protocol: TUNNEL_PROTOCOL.hysteria2 });

    first.dns.push('9.9.9.9');

    expect(buildTunnelConfig({ auth: 'secret-auth', node, protocol: TUNNEL_PROTOCOL.hysteria2 }).dns).toEqual(['1.1.1.1', '8.8.8.8']);
  });

  it('does not leak allowed ip mutations back into the shared config', () => {
    const first = buildTunnelConfig(wgInput);

    first.wireguard?.allowedIps.push('::/0');

    expect(buildTunnelConfig(wgInput).wireguard?.allowedIps).toEqual(['0.0.0.0/0']);
  });
});
