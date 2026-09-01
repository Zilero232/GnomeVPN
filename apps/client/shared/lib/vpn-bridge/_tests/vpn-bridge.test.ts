import { SPLIT_MODE } from '@gnomevpn/schemas';
import { describe, expect, it, vi } from 'vitest';

import { emptySplitConfig, normalizeSplitConfig } from '../vpn-bridge';

vi.mock('@tauri-apps/api/core', () => ({
  Channel: class {
    onmessage: unknown = null;
  },
  invoke: vi.fn()
}));

describe('emptySplitConfig', () => {
  it('returns every field at its default', () => {
    expect(emptySplitConfig()).toEqual({
      appsMode: SPLIT_MODE.allowed,
      apps: [],
      ipsMode: SPLIT_MODE.allowed,
      ips: []
    });
  });

  it('returns a fresh object each call', () => {
    const first = emptySplitConfig();
    const second = emptySplitConfig();

    expect(first).not.toBe(second);
    expect(first.apps).not.toBe(second.apps);
  });
});

describe('normalizeSplitConfig', () => {
  it('falls back to defaults for nullish input', () => {
    const defaults = emptySplitConfig();

    expect(normalizeSplitConfig(null)).toEqual(defaults);
    expect(normalizeSplitConfig(undefined)).toEqual(defaults);
  });

  it('falls back to defaults for a primitive', () => {
    expect(normalizeSplitConfig('nonsense')).toEqual(emptySplitConfig());
    expect(normalizeSplitConfig(42)).toEqual(emptySplitConfig());
  });

  it('keeps disallowed and coerces any other mode to allowed', () => {
    const config = normalizeSplitConfig({ appsMode: SPLIT_MODE.disallowed, ipsMode: 'nonsense' });

    expect(config.appsMode).toBe(SPLIT_MODE.disallowed);
    expect(config.ipsMode).toBe(SPLIT_MODE.allowed);
  });

  it('coerces a missing mode to allowed', () => {
    const config = normalizeSplitConfig({});

    expect(config.appsMode).toBe(SPLIT_MODE.allowed);
    expect(config.ipsMode).toBe(SPLIT_MODE.allowed);
  });

  it('replaces a non-array list with an empty one', () => {
    const config = normalizeSplitConfig({ apps: 'firefox', ips: { first: '1.1.1.1' } });

    expect(config.apps).toEqual([]);
    expect(config.ips).toEqual([]);
  });

  it('keeps only the string entries of a list', () => {
    const config = normalizeSplitConfig({
      apps: ['firefox.exe', 7, null, { name: 'chrome' }, 'chrome.exe'],
      ips: [undefined, '1.1.1.1', false]
    });

    expect(config.apps).toEqual(['firefox.exe', 'chrome.exe']);
    expect(config.ips).toEqual(['1.1.1.1']);
  });

  it('drops unknown keys', () => {
    const config = normalizeSplitConfig({ apps: ['firefox.exe'], extra: 'ignored' });

    expect(Object.keys(config).sort()).toEqual(['apps', 'appsMode', 'ips', 'ipsMode']);
  });
});
