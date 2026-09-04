import { describe, expect, it } from 'vitest';

import { peerClientNames } from '../peers.helpers';

const SHARED = { kind: 'session', name: 'desktop', nodeId: 'nl-1', userId: 'user-1' } as const;

describe('peerClientNames', () => {
  it('answers one name for a hysteria2 peer, whose naming never changed', () => {
    expect(peerClientNames({ ...SHARED, protocol: 'hysteria2' })).toEqual(['app-user-1-desktop-nl-1']);
  });

  it('answers one name when no protocol is given at all', () => {
    expect(peerClientNames(SHARED)).toEqual(['app-user-1-desktop-nl-1']);
  });

  it('answers both the scoped and the pre-scoping name for a wireguard peer', () => {
    expect(peerClientNames({ ...SHARED, protocol: 'wireguard' })).toEqual(['app-user-1-desktop-nl-1-wg', 'app-user-1-desktop-nl-1']);
  });

  it('puts the current name first, so a caller that writes takes the new one', () => {
    const [first] = peerClientNames({ ...SHARED, protocol: 'wireguard' });

    expect(first).toBe('app-user-1-desktop-nl-1-wg');
  });

  it('recognises a wireguard client created before the rename, so reconcile does not collect it', () => {
    const names = peerClientNames({ ...SHARED, protocol: 'wireguard' });

    expect(names).toContain('app-user-1-desktop-nl-1');
  });

  it('never repeats a name', () => {
    for (const protocol of ['hysteria2', 'wireguard'] as const) {
      const names = peerClientNames({ ...SHARED, protocol });

      expect(new Set(names).size).toBe(names.length);
    }
  });

  it('keeps a config peer under its own prefix', () => {
    expect(peerClientNames({ ...SHARED, kind: 'config', protocol: 'wireguard' })).toEqual(['cfg-user-1-desktop-nl-1-wg', 'cfg-user-1-desktop-nl-1']);
  });

  it('works for a peer with no node, where the name carries no node segment', () => {
    expect(peerClientNames({ kind: 'session', name: 'desktop', protocol: 'wireguard', userId: 'user-1' })).toEqual([
      'app-user-1-desktop-wg',
      'app-user-1-desktop'
    ]);
  });
});
