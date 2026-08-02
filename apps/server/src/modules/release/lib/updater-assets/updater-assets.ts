import { isNonNullish, last, mapValues, pickBy, pipe } from 'remeda';

import type { GithubAsset, UpdaterManifest } from '../../release.types';
import type { ProxiedUrlInput, RewriteManifestUrlsInput } from './updater-assets.types';

import { UPDATER_MANIFEST_NAME } from '../../config';

export const findManifestAsset = (assets: GithubAsset[]): GithubAsset | null => assets.find((asset) => asset.name === UPDATER_MANIFEST_NAME) ?? null;

const proxiedUrl = ({ assets, apiUrl, githubUrl }: ProxiedUrlInput): string | null => {
  const fileName = last(githubUrl.split('/'));
  const asset = assets.find((candidate) => candidate.name === fileName);

  return asset ? `${apiUrl}/release/download/${asset.id}` : null;
};

export const rewriteManifestUrls = ({ manifest, assets, apiUrl }: RewriteManifestUrlsInput): UpdaterManifest => ({
  ...manifest,
  platforms: pipe(
    manifest.platforms,
    mapValues((platform) => {
      const url = proxiedUrl({ assets, apiUrl, githubUrl: platform.url });

      return url ? { ...platform, url } : null;
    }),
    pickBy(isNonNullish)
  )
});
