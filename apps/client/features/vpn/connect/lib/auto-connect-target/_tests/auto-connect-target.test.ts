import type { Node } from '@gnomevpn/schemas';

import { describe, expect, it } from 'vitest';

import { autoConnectTarget } from '../auto-connect-target';

const node = (id: string, status: Node['status'] = 'online'): Node => ({ id, status, country: id }) as Node;

describe('autoConnectTarget', () => {
  it('refuses to pick anything when no node answered a probe', () => {
    expect(autoConnectTarget({ nodes: [node('a'), node('b')], latency: {}, lastNodeId: null })).toBeNull();
  });

  it('refuses a node whose probe came back empty', () => {
    expect(autoConnectTarget({ nodes: [node('a')], latency: { a: null }, lastNodeId: null })).toBeNull();
  });

  it('refuses a node the server reports offline even with a measured round trip', () => {
    expect(autoConnectTarget({ nodes: [node('a', 'offline')], latency: { a: 10 }, lastNodeId: null })).toBeNull();
  });

  it('returns to the node the user last used when it still answers', () => {
    const nodes = [node('a'), node('b')];

    expect(autoConnectTarget({ nodes, latency: { a: 200, b: 10 }, lastNodeId: 'a' })?.id).toBe('a');
  });

  it('abandons the last node when it stopped answering', () => {
    const nodes = [node('a'), node('b')];

    expect(autoConnectTarget({ nodes, latency: { a: null, b: 10 }, lastNodeId: 'a' })?.id).toBe('b');
  });

  it('picks the fastest node when there is no history', () => {
    const nodes = [node('a'), node('b'), node('c')];

    expect(autoConnectTarget({ nodes, latency: { a: 200, b: 10, c: 90 }, lastNodeId: null })?.id).toBe('b');
  });

  it('ignores an unmeasured node while choosing the fastest', () => {
    const nodes = [node('a'), node('b')];

    expect(autoConnectTarget({ nodes, latency: { b: 300 }, lastNodeId: null })?.id).toBe('b');
  });

  it('picks nothing out of an empty list', () => {
    expect(autoConnectTarget({ nodes: [], latency: {}, lastNodeId: null })).toBeNull();
  });
});
