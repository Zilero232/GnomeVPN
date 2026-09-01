import { describe, expect, it } from 'vitest';

import { matchesQuery } from '../matches-query';

describe('matchesQuery', () => {
  it('accepts an empty needle', () => {
    expect(matchesQuery({ name: 'Firefox', needle: '' })).toBe(true);
  });

  it('accepts a plain substring', () => {
    expect(matchesQuery({ name: 'Firefox', needle: 'fox' })).toBe(true);
    expect(matchesQuery({ name: 'Firefox', needle: 'firefox' })).toBe(true);
  });

  it('accepts letters scattered in order', () => {
    expect(matchesQuery({ name: 'Google Chrome', needle: 'gch' })).toBe(true);
  });

  it('rejects a needle longer than the name', () => {
    expect(matchesQuery({ name: 'cat', needle: 'catalog' })).toBe(false);
  });

  it('rejects correct letters in the wrong order', () => {
    expect(matchesQuery({ name: 'cat', needle: 'tac' })).toBe(false);
  });

  it('walks past a repeated letter only when the name repeats it too', () => {
    expect(matchesQuery({ name: 'banana', needle: 'aa' })).toBe(true);
    expect(matchesQuery({ name: 'cat', needle: 'aa' })).toBe(false);
  });

  it('lowercases only the name, so an uppercase needle never matches a letter', () => {
    expect(matchesQuery({ name: 'Firefox', needle: 'Fox' })).toBe(false);
    expect(matchesQuery({ name: 'Firefox', needle: 'FOX' })).toBe(false);
  });

  it('matches a lowercase needle against a mixed-case name', () => {
    expect(matchesQuery({ name: 'VLC Media Player', needle: 'vlc' })).toBe(true);
  });
});
