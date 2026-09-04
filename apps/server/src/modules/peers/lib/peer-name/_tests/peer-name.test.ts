import { describe, expect, it } from 'vitest';

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

  it('scopes a wireguard client so it cannot collide with the hysteria2 one', () => {
    const shared = { kind: 'session', name: 'desktop', nodeId: 'nl-1', userId: 'user-1' } as const;

    const hysteria = peerClientName({ ...shared, protocol: 'hysteria2' });
    const wireguard = peerClientName({ ...shared, protocol: 'wireguard' });

    expect(hysteria).not.toBe(wireguard);
    expect(wireguard).toBe(`${hysteria}-wg`);
  });

  it('leaves a hysteria2 name exactly as it was before the protocol was part of it', () => {
    const shared = { kind: 'session', name: 'desktop', nodeId: 'nl-1', userId: 'user-1' } as const;

    expect(peerClientName({ ...shared, protocol: 'hysteria2' })).toBe(peerClientName(shared));
  });

  it('treats an absent protocol as hysteria2, so an existing client still matches', () => {
    expect(peerClientName({ kind: 'config', name: 'laptop', userId: 'user-1' })).toBe('cfg-user-1-laptop');
  });

  it('scopes by protocol whether or not a node is named', () => {
    const withNode = peerClientName({ kind: 'session', name: 'desktop', nodeId: 'nl-1', protocol: 'wireguard', userId: 'user-1' });
    const without = peerClientName({ kind: 'session', name: 'desktop', protocol: 'wireguard', userId: 'user-1' });

    expect(withNode).toBe('app-user-1-desktop-nl-1-wg');
    expect(without).toBe('app-user-1-desktop-wg');
  });
});
