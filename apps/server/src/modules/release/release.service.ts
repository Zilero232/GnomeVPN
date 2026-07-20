import { Injectable, Logger } from '@nestjs/common';

import { AppServiceUnavailableException } from '../../common/exceptions';
import { describeError } from '../../common/lib';
import {
  CACHE_TTL_MS,
  EXTENSION_TO_PLATFORM,
  GITHUB_RELEASE_URL,
  GITHUB_TIMEOUT_MS,
} from './config';

import type { Release, ReleaseAsset, ReleasePlatform } from '@gnomevpn/schemas';
import type { CachedRelease, GithubRelease } from './release.types';

@Injectable()
export class ReleaseService {
  private readonly logger = new Logger(ReleaseService.name);

  private cached: CachedRelease | null = null;

  private detectPlatform(name: string): ReleasePlatform | null {
    const extension = name.toLowerCase().split('.').pop();

    return extension ? (EXTENSION_TO_PLATFORM[extension] ?? null) : null;
  }

  private toRelease(data: GithubRelease): Release {
    const seen = new Set<ReleasePlatform>();
    const assets: ReleaseAsset[] = [];

    for (const asset of data.assets) {
      const platform = this.detectPlatform(asset.name);

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
        signal: AbortSignal.timeout(GITHUB_TIMEOUT_MS),
      });
    } catch (error) {
      this.logger.warn(`GitHub releases unreachable: ${describeError(error)}`);

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
