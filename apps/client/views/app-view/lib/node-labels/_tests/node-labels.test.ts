import { describe, expect, it } from 'vitest';

import { nodeLabelKeys } from '../node-labels';

describe('nodeLabelKeys', () => {
  it('says it is checking while the probe runs, whatever the server reports', () => {
    expect(nodeLabelKeys({ reachability: 'probing', status: 'online' })).toEqual({ tag: 'nodeProbing', hint: 'nodeProbing' });
    expect(nodeLabelKeys({ reachability: 'probing', status: 'degraded' })).toEqual({ tag: 'nodeProbing', hint: 'nodeProbing' });
  });

  it('blames the node when the server itself calls it offline', () => {
    expect(nodeLabelKeys({ reachability: 'unreachable', status: 'offline' })).toEqual({ tag: 'nodeOffline', hint: 'nodeOfflineHint' });
  });

  it('blames the network when the server is happy but the probe failed', () => {
    expect(nodeLabelKeys({ reachability: 'unreachable', status: 'online' })).toEqual({ tag: 'nodeUnreachable', hint: 'nodeUnreachableHint' });
  });

  it('keeps the degraded warning on a reachable but shaky node', () => {
    expect(nodeLabelKeys({ reachability: 'reachable', status: 'degraded' })).toEqual({ tag: 'nodeDegraded', hint: 'nodeDegraded' });
  });

  it('reports a healthy node as healthy', () => {
    expect(nodeLabelKeys({ reachability: 'reachable', status: 'online' })).toEqual({ tag: 'nodeOnline', hint: 'nodeOnline' });
  });

  it('never returns an empty key', () => {
    const cases = [
      { reachability: 'probing', status: 'online' },
      { reachability: 'unreachable', status: 'offline' },
      { reachability: 'unreachable', status: 'degraded' },
      { reachability: 'reachable', status: 'online' }
    ] as const;

    for (const input of cases) {
      const { tag, hint } = nodeLabelKeys(input);

      expect(tag.length).toBeGreaterThan(0);
      expect(hint.length).toBeGreaterThan(0);
    }
  });
});
