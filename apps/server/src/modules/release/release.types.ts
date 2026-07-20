export type GithubAsset = {
  id: number;
  name: string;
  size: number;
  browser_download_url: string;
};

export type GithubRelease = {
  tag_name: string;
  html_url: string;
  body: string | null;
  published_at: string | null;
  assets: GithubAsset[];
};

export type CachedRelease = {
  value: GithubRelease;
  expiresAt: number;
};

export type UpdaterManifest = {
  version: string;
  notes: string;
  pub_date: string | null;
  platforms: Record<string, { signature: string; url: string }>;
};
