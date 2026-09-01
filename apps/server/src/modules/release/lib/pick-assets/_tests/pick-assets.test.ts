import { describe, expect, it } from 'vitest';

import type { GithubAsset } from '../../../release.types';

import { pickInstallers } from '../pick-assets';

const asset = (id: number, name: string): GithubAsset => ({
  id,
  name,
  size: 1024,
  browser_download_url: `https://example.invalid/${name}`
});

describe('pickInstallers', () => {
  it('returns nothing for an empty asset list', () => {
    expect(pickInstallers([])).toEqual([]);
  });

  it('filters out assets with an unknown extension', () => {
    expect(pickInstallers([asset(1, 'latest.json'), asset(2, 'GnomeVPN.exe.sig'), asset(3, 'README.md')])).toEqual([]);
  });

  it('maps a known extension to its platform', () => {
    const result = pickInstallers([asset(1, 'GnomeVPN_1.0.0_x64.dmg')]);

    expect(result).toEqual([{ platform: 'macos', asset: asset(1, 'GnomeVPN_1.0.0_x64.dmg') }]);
  });

  it('keeps a single asset per platform', () => {
    const result = pickInstallers([asset(1, 'GnomeVPN.exe'), asset(2, 'GnomeVPN.msi'), asset(3, 'GnomeVPN.dmg')]);

    expect(result.map(({ platform }) => platform)).toEqual(['windows', 'macos']);
  });

  it('prefers the exe over the msi for windows', () => {
    const result = pickInstallers([asset(1, 'GnomeVPN.msi'), asset(2, 'GnomeVPN.exe')]);

    expect(result).toEqual([{ platform: 'windows', asset: asset(2, 'GnomeVPN.exe') }]);
  });

  it('prefers the appimage over the deb and the rpm for linux', () => {
    const result = pickInstallers([asset(1, 'GnomeVPN.rpm'), asset(2, 'GnomeVPN.deb'), asset(3, 'GnomeVPN.AppImage')]);

    expect(result).toEqual([{ platform: 'linux', asset: asset(3, 'GnomeVPN.AppImage') }]);
  });

  it('prefers the deb over the rpm when there is no appimage', () => {
    const result = pickInstallers([asset(1, 'GnomeVPN.rpm'), asset(2, 'GnomeVPN.deb')]);

    expect(result).toEqual([{ platform: 'linux', asset: asset(2, 'GnomeVPN.deb') }]);
  });

  it('detects the appimage extension case-insensitively', () => {
    expect(pickInstallers([asset(1, 'GnomeVPN.AppImage')])).toEqual([{ platform: 'linux', asset: asset(1, 'GnomeVPN.AppImage') }]);
  });

  it('detects an uppercase exe extension', () => {
    expect(pickInstallers([asset(1, 'GnomeVPN.EXE')])).toEqual([{ platform: 'windows', asset: asset(1, 'GnomeVPN.EXE') }]);
  });

  it('picks one asset for each of the four platforms', () => {
    const result = pickInstallers([
      asset(1, 'GnomeVPN.exe'),
      asset(2, 'GnomeVPN.msi'),
      asset(3, 'GnomeVPN.dmg'),
      asset(4, 'GnomeVPN.deb'),
      asset(5, 'GnomeVPN.apk'),
      asset(6, 'latest.json')
    ]);

    expect(result.map(({ platform }) => platform).sort()).toEqual(['android', 'linux', 'macos', 'windows']);
  });
});
