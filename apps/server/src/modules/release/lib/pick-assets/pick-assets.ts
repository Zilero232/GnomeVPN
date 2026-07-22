import { pipe, sortBy, uniqueBy } from 'remeda';

import { EXTENSION_TO_PLATFORM, PLATFORM_EXTENSION_PRIORITY } from '../../config';

import type { ReleasePlatform } from '@gnomevpn/schemas';
import type { GithubAsset } from '../../release.types';
import type { PlatformAsset } from './pick-assets.types';

const extensionOf = (name: string): string => name.toLowerCase().split('.').pop() ?? '';

const detectPlatform = (name: string): ReleasePlatform | null =>
  EXTENSION_TO_PLATFORM[extensionOf(name)] ?? null;

const rank = (asset: GithubAsset): number => {
  const index = PLATFORM_EXTENSION_PRIORITY.indexOf(extensionOf(asset.name));

  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
};

// `sortBy` is stable and `uniqueBy` keeps the first of each group, so the best
// ranked asset per platform survives and ties fall to the earlier asset — the
// same outcome as comparing ranks pairwise.
export const pickInstallers = (assets: GithubAsset[]): PlatformAsset[] =>
  pipe(
    assets.flatMap((asset) => {
      const platform = detectPlatform(asset.name);

      return platform ? [{ platform, asset }] : [];
    }),
    sortBy(({ asset }) => rank(asset)),
    uniqueBy(({ platform }) => platform),
  );
