import type { ReleasePlatform } from '@gnomevpn/schemas';

const GITHUB_REPO_URL = 'https://api.github.com/repos/Zilero232/GnomeVPN';

export const GITHUB_RELEASE_URL = `${GITHUB_REPO_URL}/releases/latest`;

export const githubAssetUrl = (assetId: number): string =>
  `${GITHUB_REPO_URL}/releases/assets/${assetId}`;

export const GITHUB_TIMEOUT_MS = 8_000;

export const CACHE_TTL_MS = 10 * 60_000;

export const EXTENSION_TO_PLATFORM: Record<string, ReleasePlatform> = {
  exe: 'windows',
  msi: 'windows',
  apk: 'android'
};

export const PLATFORM_EXTENSION_PRIORITY = ['exe', 'msi', 'apk'];

export const UPDATER_MANIFEST_NAME = 'latest.json';
