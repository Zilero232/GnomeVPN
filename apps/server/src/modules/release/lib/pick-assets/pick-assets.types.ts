import type { ReleasePlatform } from '@gnomevpn/schemas';
import type { GithubAsset } from '../../release.types';

export type PlatformAsset = {
  platform: ReleasePlatform;
  asset: GithubAsset;
};
