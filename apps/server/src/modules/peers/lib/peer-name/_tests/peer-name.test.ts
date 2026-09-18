import { describe, expect, it } from 'vitest';

import { PEER_PROTOCOL_SUFFIX } from '../../../config';
import { peerClientName } from '../peer-name';

describe('peerClientName', () => {
  it('prefixes a session peer with the session prefix', () => {
    expect(peerClientName({ kind: 'session', name: 'desktop', userId: 'user-1' })).toBe('app-user-1-desktop');
  });

  it('prefixes a config peer with the config prefix', () => {
    expect(peerClientName({ kind: 'config', name: 'desktop', userId: 'user-1' })).toBe('cfg-user-1-desktop');
  });

  it('slugifies the device name', () => {
    expect(peerClientName({ kind: 'session', name: 'My Phone 2', userId: 'user-1' })).toBe('app-user-1-my-phone-2');
  });

  it('transliterates a cyrillic device name', () => {
    expect(peerClientName({ kind: 'session', name: 'Мой Телефон', userId: 'user-1' })).toBe('app-user-1-moy-telefon');
  });

  it('leaves a trailing dash when the name is null', () => {
    expect(peerClientName({ kind: 'session', name: null, userId: 'user-1' })).toBe('app-user-1-');
  });

  it('leaves a trailing dash when the name is omitted', () => {
    expect(peerClientName({ kind: 'config', userId: 'user-1' })).toBe('cfg-user-1-');
  });

  it('appends the node id when one is given', () => {
    expect(peerClientName({ kind: 'session', name: 'desktop', nodeId: 'node-9', userId: 'user-1' })).toBe('app-user-1-desktop-node-9');
  });

  it('omits the node segment when no node id is given', () => {
    expect(peerClientName({ kind: 'session', name: 'desktop', userId: 'user-1' })).not.toContain('node-9');
  });

  it('scopes a vless client so it cannot collide with the hysteria2 one', () => {
    const shared = { kind: 'session', name: 'desktop', nodeId: 'nl-1', userId: 'user-1' } as const;

    const hysteria = peerClientName({ ...shared, protocol: 'hysteria2' });
    const vless = peerClientName({ ...shared, protocol: 'vless' });

    expect(hysteria).not.toBe(vless);
    expect(vless).toBe(`${hysteria}${PEER_PROTOCOL_SUFFIX.vless}`);
  });

  it('scopes a vless client so it cannot collide with the hysteria2 one on the same node', () => {
    const shared = { kind: 'config', name: 'incy', nodeId: 'nl-1', userId: 'user-1' } as const;

    const hysteria = peerClientName({ ...shared, protocol: 'hysteria2' });
    const vless = peerClientName({ ...shared, protocol: 'vless' });

    expect(vless).not.toBe(hysteria);
    expect(vless).toBe(`${hysteria}${PEER_PROTOCOL_SUFFIX.vless}`);
  });

  it('gives every protocol on one node a name of its own, which the panel requires', () => {
    const shared = { kind: 'config', name: 'incy', nodeId: 'nl-1', userId: 'user-1' } as const;

    const names = (['hysteria2', 'vless'] as const).map((protocol) => peerClientName({ ...shared, protocol }));

    expect(new Set(names).size).toBe(names.length);
  });

  it('leaves a hysteria2 name exactly as it was before the protocol was part of it', () => {
    const shared = { kind: 'session', name: 'desktop', nodeId: 'nl-1', userId: 'user-1' } as const;

    expect(peerClientName({ ...shared, protocol: 'hysteria2' })).toBe(peerClientName(shared));
  });

  it('treats an absent protocol as hysteria2, so an existing client still matches', () => {
    expect(peerClientName({ kind: 'config', name: 'laptop', userId: 'user-1' })).toBe('cfg-user-1-laptop');
  });

  it('scopes by protocol whether or not a node is named', () => {
    const withNode = peerClientName({ kind: 'session', name: 'desktop', nodeId: 'nl-1', protocol: 'vless', userId: 'user-1' });
    const without = peerClientName({ kind: 'session', name: 'desktop', protocol: 'vless', userId: 'user-1' });

    expect(withNode).toBe('app-user-1-desktop-nl-1-vl');
    expect(without).toBe('app-user-1-desktop-vl');
  });
});
