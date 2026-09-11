import { describe, expect, it } from 'vitest';

import { unavailableHintKey } from '../connect-hint';

describe('unavailableHintKey', () => {
  it('explains a probe still running', () => {
    expect(unavailableHintKey('probing')).toBe('connectHintProbing');
  });

  it('explains a node that did not answer', () => {
    expect(unavailableHintKey('unreachable')).toBe('connectHintUnreachable');
  });

  it('falls back to the empty-list message for a reachable node, which should not reach it', () => {
    expect(unavailableHintKey('reachable')).toBe('connectHintNoNode');
  });
});
