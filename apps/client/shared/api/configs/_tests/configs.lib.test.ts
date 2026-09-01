import { describe, expect, it } from 'vitest';

import { parseFileName } from '../configs.lib';

describe('parseFileName', () => {
  it('reads a quoted filename', () => {
    expect(parseFileName('attachment; filename="node-de.conf"')).toBe('node-de.conf');
  });

  it('reads an unquoted filename', () => {
    expect(parseFileName('attachment; filename=node-de.conf')).toBe('node-de.conf');
  });

  it('stops at the parameter that follows', () => {
    expect(parseFileName('attachment; filename="node-de.conf"; size=42')).toBe('node-de.conf');
    expect(parseFileName('attachment; filename=node-de.conf; size=42')).toBe('node-de.conf');
  });

  it('matches the token case-insensitively', () => {
    expect(parseFileName('attachment; Filename="node-de.conf"')).toBe('node-de.conf');
    expect(parseFileName('attachment; FILENAME=node-de.conf')).toBe('node-de.conf');
  });

  it('falls back when the input is not a string', () => {
    expect(parseFileName(undefined)).toBe('GnomeVPN.conf');
    expect(parseFileName(null)).toBe('GnomeVPN.conf');
    expect(parseFileName(42)).toBe('GnomeVPN.conf');
  });

  it('falls back when the header carries no filename', () => {
    expect(parseFileName('attachment')).toBe('GnomeVPN.conf');
    expect(parseFileName('')).toBe('GnomeVPN.conf');
  });
});
