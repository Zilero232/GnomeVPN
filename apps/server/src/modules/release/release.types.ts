import type { Release } from '@gnomevpn/schemas';

export type CachedRelease = {
  value: Release;
  expiresAt: number;
};

export type GithubAsset = {
  name: string;
  size: number;
  browser_download_url: string;
};

export type GithubRelease = {
  tag_name: string;
  html_url: string;
  published_at: string | null;
  assets: GithubAsset[];
};
