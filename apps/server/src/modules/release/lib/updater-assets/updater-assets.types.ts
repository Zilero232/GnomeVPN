import type { GithubAsset, UpdaterManifest } from '../../release.types';

export type RewriteManifestUrlsInput = {
  manifest: UpdaterManifest;
  assets: GithubAsset[];
  apiUrl: string;
};

export type ProxiedUrlInput = {
  assets: GithubAsset[];
  apiUrl: string;
  githubUrl: string;
};
