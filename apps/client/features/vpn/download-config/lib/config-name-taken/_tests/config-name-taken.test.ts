import { describe, expect, it } from 'vitest';

import type { ConfigSlot } from '../config-name-taken.types';

import { isConfigNameTaken, takenConfigNames } from '../config-name-taken';

const CONFIGS: ConfigSlot[] = [
  { name: 'Laptop', nodeId: 'nl-1', protocol: 'hysteria2' },
  { name: 'Phone', nodeId: 'nl-1', protocol: 'hysteria2' },
  { name: 'Laptop', nodeId: 'nl-1', protocol: 'wireguard' },
  { name: 'Laptop', nodeId: 'de-1', protocol: 'hysteria2' }
];

describe('takenConfigNames', () => {
  it('lists the names already used on that node for that protocol', () => {
    expect(takenConfigNames({ configs: CONFIGS, nodeId: 'nl-1', protocol: 'hysteria2' })).toEqual(['Laptop', 'Phone']);
  });

  it('scopes the list to one protocol', () => {
    expect(takenConfigNames({ configs: CONFIGS, nodeId: 'nl-1', protocol: 'wireguard' })).toEqual(['Laptop']);
  });

  it('scopes the list to one node', () => {
    expect(takenConfigNames({ configs: CONFIGS, nodeId: 'de-1', protocol: 'hysteria2' })).toEqual(['Laptop']);
  });

  it('lists nothing for a node with no configs', () => {
    expect(takenConfigNames({ configs: CONFIGS, nodeId: 'fr-1', protocol: 'hysteria2' })).toEqual([]);
  });

  it('lists nothing before a node has been picked', () => {
    expect(takenConfigNames({ configs: CONFIGS, nodeId: undefined, protocol: 'hysteria2' })).toEqual([]);
  });

  it('lists nothing before a protocol has been picked', () => {
    expect(takenConfigNames({ configs: CONFIGS, nodeId: 'nl-1', protocol: undefined })).toEqual([]);
  });
});

describe('isConfigNameTaken', () => {
  it('rejects a name already used on the same node and protocol', () => {
    const slot: ConfigSlot = { name: 'Laptop', nodeId: 'nl-1', protocol: 'hysteria2' };

    expect(isConfigNameTaken({ configs: CONFIGS, slot })).toBe(true);
  });

  it('allows the same name on a different node', () => {
    const slot: ConfigSlot = { name: 'Phone', nodeId: 'de-1', protocol: 'hysteria2' };

    expect(isConfigNameTaken({ configs: CONFIGS, slot })).toBe(false);
  });

  it('allows the same name under a different protocol', () => {
    const slot: ConfigSlot = { name: 'Phone', nodeId: 'nl-1', protocol: 'wireguard' };

    expect(isConfigNameTaken({ configs: CONFIGS, slot })).toBe(false);
  });

  it('allows a name nobody has used', () => {
    const slot: ConfigSlot = { name: 'Tablet', nodeId: 'nl-1', protocol: 'hysteria2' };

    expect(isConfigNameTaken({ configs: CONFIGS, slot })).toBe(false);
  });

  it('matches the name exactly, so case still distinguishes two configs', () => {
    const slot: ConfigSlot = { name: 'laptop', nodeId: 'nl-1', protocol: 'hysteria2' };

    expect(isConfigNameTaken({ configs: CONFIGS, slot })).toBe(false);
  });

  it('allows anything when the user has no configs yet', () => {
    const slot: ConfigSlot = { name: 'Laptop', nodeId: 'nl-1', protocol: 'hysteria2' };

    expect(isConfigNameTaken({ configs: [], slot })).toBe(false);
  });

  it('agrees with the list the form warns from', () => {
    const taken = takenConfigNames({ configs: CONFIGS, nodeId: 'nl-1', protocol: 'hysteria2' });

    for (const name of taken) {
      expect(isConfigNameTaken({ configs: CONFIGS, slot: { name, nodeId: 'nl-1', protocol: 'hysteria2' } })).toBe(true);
    }
  });
});
