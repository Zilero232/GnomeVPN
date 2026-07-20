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
