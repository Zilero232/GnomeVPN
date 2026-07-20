import { UPDATER_ARCHIVE_SUFFIX, UPDATER_SIGNATURE_SUFFIX } from '../config';

import type { GithubAsset } from '../release.types';

export type UpdaterAssets = {
  archive: GithubAsset;
  signature: GithubAsset;
};

export const findUpdaterAssets = (assets: GithubAsset[]): UpdaterAssets | null => {
  const archive = assets.find((asset) => asset.name.endsWith(UPDATER_ARCHIVE_SUFFIX));
  const signature = assets.find((asset) => asset.name.endsWith(UPDATER_SIGNATURE_SUFFIX));

  return archive && signature ? { archive, signature } : null;
};
