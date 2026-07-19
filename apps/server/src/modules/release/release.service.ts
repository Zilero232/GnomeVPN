import { Injectable, Logger } from '@nestjs/common';

import { AppServiceUnavailableException } from '../../common/exceptions';

import type { Release, ReleaseAsset, ReleasePlatform } from '@gnomevpn/schemas';

const GITHUB_RELEASE_URL = 'https://api.github.com/repos/Zilero232/GnomeVPN/releases/latest';

// GitHub allows 60 unauthenticated requests per hour per IP. Every landing
// visitor would otherwise spend one, so the answer is cached here.
const CACHE_TTL_MS = 10 * 60_000;

const EXTENSION_TO_PLATFORM: Record<string, ReleasePlatform> = {
  exe: 'windows',
  msi: 'windows',
};

type GithubAsset = {
  name: string;
  size: number;
  browser_download_url: string;
};

type GithubRelease = {
  tag_name: string;
  html_url: string;
  published_at: string | null;
  assets: GithubAsset[];
};

@Injectable()
export class ReleaseService {
  private readonly logger = new Logger(ReleaseService.name);

  private cached: { value: Release; expiresAt: number } | null = null;

  private detectPlatform(name: string): ReleasePlatform | null {
    const extension = name.toLowerCase().split('.').pop();

    return extension ? (EXTENSION_TO_PLATFORM[extension] ?? null) : null;
  }

  private toRelease(data: GithubRelease): Release {
    const seen = new Set<ReleasePlatform>();
    const assets: ReleaseAsset[] = [];

    for (const asset of data.assets) {
      const platform = this.detectPlatform(asset.name);

      // One entry per platform: a release carries several Linux packages.
      if (!platform || seen.has(platform)) {
        continue;
      }

      seen.add(platform);
      assets.push({
        platform,
        name: asset.name,
        sizeBytes: asset.size,
        downloadUrl: asset.browser_download_url,
      });
    }

    return {
      version: data.tag_name.replace(/^v/, ''),
      htmlUrl: data.html_url,
      publishedAt: data.published_at,
      assets,
    };
  }

  async getLatest(): Promise<Release> {
    if (this.cached && this.cached.expiresAt > Date.now()) {
      return this.cached.value;
    }

    let response: Response;

    try {
      response = await fetch(GITHUB_RELEASE_URL, {
        headers: { Accept: 'application/vnd.github+json' },
        signal: AbortSignal.timeout(8000),
      });
    } catch (error) {
      this.logger.warn(`GitHub releases unreachable: ${String(error)}`);

      throw new AppServiceUnavailableException('INTERNAL_ERROR', 'Release info unavailable');
    }

    if (!response.ok) {
      this.logger.warn(`GitHub responded with ${response.status}`);

      throw new AppServiceUnavailableException('INTERNAL_ERROR', 'Release info unavailable');
    }

    const release = this.toRelease((await response.json()) as GithubRelease);

    this.cached = { value: release, expiresAt: Date.now() + CACHE_TTL_MS };

    return release;
  }
}
