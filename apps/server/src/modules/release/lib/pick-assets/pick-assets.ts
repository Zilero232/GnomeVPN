import type { ReleasePlatform } from '@gnomevpn/schemas';

import { pipe, sortBy, uniqueBy } from 'remeda';

import type { GithubAsset } from '../../release.types';
import type { PlatformAsset } from './pick-assets.types';

import { EXTENSION_TO_PLATFORM, PLATFORM_EXTENSION_PRIORITY } from '../../config';

const extensionOf = (name: string) => name.toLowerCase().split('.').pop() ?? '';

const detectPlatform = (name: string): ReleasePlatform | null => EXTENSION_TO_PLATFORM[extensionOf(name)] ?? null;

const rank = (asset: GithubAsset) => {
  const index = PLATFORM_EXTENSION_PRIORITY.indexOf(extensionOf(asset.name));

  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
};

export const pickInstallers = (assets: GithubAsset[]): PlatformAsset[] =>
  pipe(
    assets.flatMap((asset) => {
      const platform = detectPlatform(asset.name);

      return platform ? [{ platform, asset }] : [];
    }),
    sortBy(({ asset }) => rank(asset)),
    uniqueBy(({ platform }) => platform)
  );
