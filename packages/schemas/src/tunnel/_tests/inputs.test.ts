import { describe, expect, it } from 'vitest';

import { issueConfigSchema } from '../inputs';

const nodeId = '11111111-1111-4111-8111-111111111111';

const parseName = (name: string) => issueConfigSchema.safeParse({ nodeId, name });

describe('issueConfigSchema', () => {
  it('trims the surrounding whitespace off the name', () => {
    const result = parseName('  home laptop  ');

    expect(result.success).toBe(true);
    expect(result.data?.name).toBe('home laptop');
  });

  it('collapses internal runs of whitespace to a single space', () => {
    expect(parseName('a b   c').data?.name).toBe('a b c');
    expect(parseName('a\t\n  b').data?.name).toBe('a b');
  });

  it('rejects an empty name', () => {
    const result = parseName('');

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('validation.nameRequired');
  });

  it('rejects a name that is only whitespace', () => {
    const result = parseName('    ');

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('validation.nameRequired');
  });

  it('accepts a name of exactly the maximum length', () => {
    expect(parseName('x'.repeat(32)).success).toBe(true);
  });

  it('rejects a name longer than the maximum', () => {
    const result = parseName('x'.repeat(33));

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('validation.nameMax');
  });

  it('measures the length before collapsing, so padding counts against the maximum', () => {
    expect(parseName(`a${' '.repeat(30)}b`).data?.name).toBe('a b');

    const result = parseName(`home${' '.repeat(30)}laptop`);

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('validation.nameMax');
  });

  it('defaults the protocol to hysteria2', () => {
    expect(parseName('laptop').data?.protocol).toBe('hysteria2');
  });
});
