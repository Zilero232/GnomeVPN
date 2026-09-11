import type { Node } from '@gnomevpn/schemas';

import { describe, expect, it } from 'vitest';

import { firstReachableNode, isConnectable, resolveReachability } from '../node-reachability';

const node = (id: string, status: Node['status'] = 'online'): Node =>
  ({ id, status, country: 'Finland', countryCode: 'fi', city: 'Helsinki' }) as Node;

describe('resolveReachability', () => {
  it('calls a missing node unreachable', () => {
    expect(resolveReachability({ node: undefined, latency: {}, isMeasuring: false })).toBe('unreachable');
  });

  it('calls a node the server reports offline unreachable, whatever the probe said', () => {
    expect(resolveReachability({ node: node('a', 'offline'), latency: { a: 42 }, isMeasuring: false })).toBe('unreachable');
  });

  it('calls a node with a measured round trip reachable', () => {
    expect(resolveReachability({ node: node('a'), latency: { a: 42 }, isMeasuring: false })).toBe('reachable');
  });

  it('calls a node probing while the first measurement is still running', () => {
    expect(resolveReachability({ node: node('a'), latency: {}, isMeasuring: true })).toBe('probing');
  });

  it('calls a node that answered no probe unreachable once measuring finished', () => {
    expect(resolveReachability({ node: node('a'), latency: { a: null }, isMeasuring: false })).toBe('unreachable');
  });

  it('keeps a node probing while it is being re-measured after a failure', () => {
    expect(resolveReachability({ node: node('a'), latency: { a: null }, isMeasuring: true })).toBe('probing');
  });

  it('stays probing when no probe has run yet, rather than trusting the server', () => {
    expect(resolveReachability({ node: node('a'), latency: {}, isMeasuring: false })).toBe('probing');
  });

  it('judges each node by its own probe', () => {
    const latency = { a: 42, b: null };

    expect(resolveReachability({ node: node('a'), latency, isMeasuring: false })).toBe('reachable');
    expect(resolveReachability({ node: node('b'), latency, isMeasuring: false })).toBe('unreachable');
  });
});

describe('isConnectable', () => {
  it('allows only a node with a measured round trip', () => {
    expect(isConnectable('reachable')).toBe(true);
  });

  it('refuses a node that is still being probed', () => {
    expect(isConnectable('probing')).toBe(false);
  });

  it('refuses a node that failed its probe', () => {
    expect(isConnectable('unreachable')).toBe(false);
  });
});

describe('firstReachableNode', () => {
  it('skips a node whose probe came back empty', () => {
    const nodes = [node('a'), node('b')];

    expect(firstReachableNode({ nodes, latency: { a: null, b: 42 }, isMeasuring: false })?.id).toBe('b');
  });

  it('skips a node the server reports offline', () => {
    const nodes = [node('a', 'offline'), node('b')];

    expect(firstReachableNode({ nodes, latency: {}, isMeasuring: false })?.id).toBe('b');
  });

  it('takes a probing node rather than none at all', () => {
    const nodes = [node('a')];

    expect(firstReachableNode({ nodes, latency: {}, isMeasuring: true })?.id).toBe('a');
  });

  it('prefers a measured node over one still being probed', () => {
    const nodes = [node('a'), node('b')];

    expect(firstReachableNode({ nodes, latency: { b: 42 }, isMeasuring: true })?.id).toBe('b');
  });

  it('returns nothing when every node failed its probe', () => {
    const nodes = [node('a'), node('b')];

    expect(firstReachableNode({ nodes, latency: { a: null, b: null }, isMeasuring: false })).toBeUndefined();
  });
});
