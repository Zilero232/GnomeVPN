import { TUNNEL_PROTOCOL } from '@gnomevpn/schemas';
import { describe, expect, it } from 'vitest';

import type { TunnelNode } from '../build-config.types';

import { REALITY, TUNNEL } from '../../../config';
import { buildTunnelConfig } from '../build-config';

const node: TunnelNode = {
  host: '203.0.113.10',
  port: 443,
  serverName: 'cdn.example.com',
  certFingerprint: 'AA:BB:CC:DD',
  realityPublicKey: 'node-reality-key',
  realityShortId: 'aabbccdd'
};

const hysteria2 = { auth: 'secret-auth', node, protocol: TUNNEL_PROTOCOL.hysteria2 };
const vless = { auth: 'peer-uuid', node, protocol: TUNNEL_PROTOCOL.vless };

describe('buildTunnelConfig over hysteria2', () => {
  it('builds the tunnel from the node endpoint', () => {
    expect(buildTunnelConfig(hysteria2)).toEqual({
      auth: hysteria2.auth,
      certFingerprint: node.certFingerprint,
      dns: [...TUNNEL.dns],
      insecure: TUNNEL.insecure,
      port: node.port,
      protocol: TUNNEL_PROTOCOL.hysteria2,
      server: node.host,
      serverName: node.serverName
    });
  });

  it('carries no reality block, which belongs to the other protocol', () => {
    expect(buildTunnelConfig(hysteria2)).not.toHaveProperty('reality');
  });

  it('carries the node certificate fingerprint, which the client pins instead of skipping verification', () => {
    expect(buildTunnelConfig(hysteria2).certFingerprint).toBe(node.certFingerprint);
  });

  it('leaves the fingerprint empty for a node provisioned before one was captured', () => {
    const bare = { ...node, certFingerprint: null };

    expect(buildTunnelConfig({ ...hysteria2, node: bare }).certFingerprint).toBe('');
  });
});

describe('buildTunnelConfig over vless', () => {
  it('points at the reality port rather than the hysteria2 one', () => {
    expect(buildTunnelConfig(vless).port).toBe(REALITY.listenPort);
  });

  it('carries the node reality keys, which the client cannot derive', () => {
    expect(buildTunnelConfig(vless).reality).toEqual({
      publicKey: node.realityPublicKey,
      shortId: node.realityShortId,
      fingerprint: REALITY.fingerprint,
      flow: REALITY.flow
    });
  });

  it('never marks a reality server insecure — it borrows a real certificate', () => {
    expect(buildTunnelConfig(vless).insecure).toBe(false);
  });

  it('refuses a node that was never provisioned with reality keys', () => {
    const bare = { ...node, realityPublicKey: null, realityShortId: null };

    expect(() => buildTunnelConfig({ ...vless, node: bare })).toThrow();
  });
});
