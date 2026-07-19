import { describe, expect, it } from 'vitest';

import { parseIniValue } from '../wg-easy-ini';

const sample = `
[Interface]
PrivateKey = abc123
Address = 10.8.0.2/24

[Peer]
PublicKey = def456
`;

describe('parseIniValue', () => {
  it('returns the value for a key under the given section', () => {
    expect(parseIniValue(sample, 'Interface', 'PrivateKey')).toBe('abc123');
    expect(parseIniValue(sample, 'Peer', 'PublicKey')).toBe('def456');
  });

  it('is case-insensitive for section and key names', () => {
    expect(parseIniValue(sample, 'interface', 'privatekey')).toBe('abc123');
  });

  it('returns null when the section does not exist', () => {
    expect(parseIniValue(sample, 'Missing', 'PrivateKey')).toBeNull();
  });

  it('returns null when the key does not exist in the section', () => {
    expect(parseIniValue(sample, 'Interface', 'Missing')).toBeNull();
  });

  it('does not read a key belonging to a different section', () => {
    expect(parseIniValue(sample, 'Peer', 'PrivateKey')).toBeNull();
  });
});
