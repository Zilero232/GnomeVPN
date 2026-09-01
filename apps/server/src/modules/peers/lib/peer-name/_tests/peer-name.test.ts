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
});
