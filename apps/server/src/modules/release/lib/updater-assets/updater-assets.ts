import { isNonNullish, last, mapValues, pickBy, pipe } from 'remeda';

import type { GithubAsset, UpdaterManifest } from '../../release.types';
import type { ProxiedUrlInput, RewriteManifestUrlsInput } from './updater-assets.types';

import { UPDATER_MANIFEST_NAME } from '../../config';

export const findManifestAsset = (assets: GithubAsset[]): GithubAsset | null => assets.find((asset) => asset.name === UPDATER_MANIFEST_NAME) ?? null;

export const parseManifestBody = (body: string): unknown => {
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
};

const proxiedUrl = ({ assets, apiUrl, githubUrl }: ProxiedUrlInput): string | null => {
  const segment = last(githubUrl.split('/'));

  if (!segment) {
    return null;
  }

  const assetId = Number(segment);
  const asset = Number.isInteger(assetId)
    ? assets.find((candidate) => candidate.id === assetId)
    : assets.find((candidate) => candidate.name === decodeURIComponent(segment));

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
