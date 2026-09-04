import type { z } from 'zod';

import type { githubAssetSchema, githubReleaseSchema, updaterManifestSchema } from './lib';

export type GithubAsset = z.infer<typeof githubAssetSchema>;
export type GithubRelease = z.infer<typeof githubReleaseSchema>;
export type UpdaterManifest = z.infer<typeof updaterManifestSchema>;

export type CachedRelease = {
  value: Promise<GithubRelease>;
  expiresAt: number;
};
