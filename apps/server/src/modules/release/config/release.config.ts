import type { ReleasePlatform } from '@gnomevpn/schemas';

export const GITHUB_RELEASE_URL = 'https://api.github.com/repos/Zilero232/GnomeVPN/releases/latest';

export const GITHUB_TIMEOUT_MS = 8_000;

export const CACHE_TTL_MS = 10 * 60_000;

export const EXTENSION_TO_PLATFORM: Record<string, ReleasePlatform> = {
  exe: 'windows',
  msi: 'windows',
};
