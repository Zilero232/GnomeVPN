import { describe, expect, it } from 'vitest';

import type { GithubAsset, UpdaterManifest } from '../../../release.types';

import { findManifestAsset, parseManifestBody, rewriteManifestUrls } from '../updater-assets';

const API_URL = 'https://api.gnomevpn.invalid';

const asset = (id: number, name: string): GithubAsset => ({
  id,
  name,
  size: 1024,
  browser_download_url: `https://github.invalid/download/${name}`
});

const manifest = (platforms: UpdaterManifest['platforms']): UpdaterManifest => ({
  version: '1.4.2',
  notes: 'release notes',
  pub_date: '2026-01-15T12:00:00Z',
  platforms
});

describe('parseManifestBody', () => {
  it('parses a valid json body', () => {
    expect(parseManifestBody('{"version":"1.0.0"}')).toEqual({ version: '1.0.0' });
  });

  it('returns null for a malformed json body', () => {
    expect(parseManifestBody('{"version":')).toBeNull();
  });

  it('returns null for an empty body', () => {
    expect(parseManifestBody('')).toBeNull();
  });

  it('returns null for a body that is not json at all', () => {
    expect(parseManifestBody('<html>404</html>')).toBeNull();
  });
});

describe('findManifestAsset', () => {
  it('finds the asset named latest.json', () => {
    const target = asset(7, 'latest.json');

    expect(findManifestAsset([asset(1, 'GnomeVPN.exe'), target])).toEqual(target);
  });

  it('returns null when there is no manifest asset', () => {
    expect(findManifestAsset([asset(1, 'GnomeVPN.exe')])).toBeNull();
  });
});

describe('rewriteManifestUrls', () => {
  it('rewrites a platform url matched by its numeric asset id', () => {
    const result = rewriteManifestUrls({
      manifest: manifest({ 'windows-x86_64': { signature: 'sig', url: 'https://api.github.com/repos/o/r/releases/assets/42' } }),
      assets: [asset(42, 'GnomeVPN.exe')],
      apiUrl: API_URL
    });

    expect(result.platforms['windows-x86_64'].url).toBe(`${API_URL}/release/download/42`);
  });

  it('falls back to the decoded asset name when the last segment is not an id', () => {
    const result = rewriteManifestUrls({
      manifest: manifest({ 'darwin-aarch64': { signature: 'sig', url: 'https://github.invalid/download/GnomeVPN%20Setup.dmg' } }),
      assets: [asset(11, 'GnomeVPN Setup.dmg')],
      apiUrl: API_URL
    });

    expect(result.platforms['darwin-aarch64'].url).toBe(`${API_URL}/release/download/11`);
  });

  it('keeps the signature of a rewritten platform', () => {
    const result = rewriteManifestUrls({
      manifest: manifest({ 'windows-x86_64': { signature: 'the-signature', url: 'https://github.invalid/download/99' } }),
      assets: [asset(99, 'GnomeVPN.exe')],
      apiUrl: API_URL
    });

    expect(result.platforms['windows-x86_64'].signature).toBe('the-signature');
  });

  it('drops a platform whose asset cannot be resolved', () => {
    const result = rewriteManifestUrls({
      manifest: manifest({
        'windows-x86_64': { signature: 'sig', url: 'https://github.invalid/download/42' },
        'linux-x86_64': { signature: 'sig', url: 'https://github.invalid/download/GnomeVPN.AppImage' }
      }),
      assets: [asset(42, 'GnomeVPN.exe')],
      apiUrl: API_URL
    });

    expect(Object.keys(result.platforms)).toEqual(['windows-x86_64']);
  });

  it('drops every platform when no asset matches', () => {
    const result = rewriteManifestUrls({
      manifest: manifest({ 'windows-x86_64': { signature: 'sig', url: 'https://github.invalid/download/GnomeVPN.exe' } }),
      assets: [asset(7, 'other.exe')],
      apiUrl: API_URL
    });

    expect(result.platforms).toEqual({});
  });

  it('keeps the version, the notes and the publish date untouched', () => {
    const source = manifest({ 'windows-x86_64': { signature: 'sig', url: 'https://github.invalid/download/42' } });

    const result = rewriteManifestUrls({ manifest: source, assets: [asset(42, 'GnomeVPN.exe')], apiUrl: API_URL });

    expect(result).toMatchObject({ version: '1.4.2', notes: 'release notes', pub_date: '2026-01-15T12:00:00Z' });
  });

  it('rewrites every resolvable platform in one pass', () => {
    const result = rewriteManifestUrls({
      manifest: manifest({
        'windows-x86_64': { signature: 'a', url: 'https://github.invalid/download/1' },
        'darwin-aarch64': { signature: 'b', url: 'https://github.invalid/download/2' },
        'linux-x86_64': { signature: 'c', url: 'https://github.invalid/download/3' }
      }),
      assets: [asset(1, 'GnomeVPN.exe'), asset(2, 'GnomeVPN.dmg'), asset(3, 'GnomeVPN.AppImage')],
      apiUrl: API_URL
    });

    expect(Object.values(result.platforms).map(({ url }) => url)).toEqual([
      `${API_URL}/release/download/1`,
      `${API_URL}/release/download/2`,
      `${API_URL}/release/download/3`
    ]);
  });
});
