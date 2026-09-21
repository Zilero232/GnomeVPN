import { describe, expect, it } from 'vitest';

import { LINK_CODE_ALPHABET, LINK_CODE_LENGTH } from '../../../config';
import { generateLinkCode, normaliseLinkCode } from '../link-code';

describe('generateLinkCode', () => {
  it('returns a code of the agreed length', () => {
    expect(generateLinkCode()).toHaveLength(LINK_CODE_LENGTH);
  });

  it('draws only from the alphabet, so nothing renders as a character the reader cannot type', () => {
    for (const character of generateLinkCode()) {
      expect(LINK_CODE_ALPHABET).toContain(character);
    }
  });

  it('leaves out the glyphs a reader confuses, which is what makes the code retypable at all', () => {
    for (const ambiguous of ['0', 'O', '1', 'I', 'L']) {
      expect(LINK_CODE_ALPHABET).not.toContain(ambiguous);
    }
  });

  it('does not repeat itself across calls', () => {
    const codes = new Set(Array.from({ length: 50 }, generateLinkCode));

    expect(codes.size).toBeGreaterThan(45);
  });
});

describe('normaliseLinkCode', () => {
  it('accepts the code however the sender capitalised it', () => {
    expect(normaliseLinkCode('abc23xyz')).toBe('ABC23XYZ');
  });

  it('forgives the whitespace a chat client adds around a pasted code', () => {
    expect(normaliseLinkCode('  ABC23XYZ  ')).toBe('ABC23XYZ');
    expect(normaliseLinkCode('ABC2 3XYZ')).toBe('ABC23XYZ');
  });

  it('leaves an already clean code untouched', () => {
    const code = generateLinkCode();

    expect(normaliseLinkCode(code)).toBe(code);
  });
});
