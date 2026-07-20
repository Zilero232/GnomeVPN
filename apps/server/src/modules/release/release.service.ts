import { Injectable, Logger } from '@nestjs/common';

import { AppServiceUnavailableException } from '../../common/exceptions';
import { describeError } from '../../common/lib';
import { AppConfigService } from '../../config/config.module';
import {
  CACHE_TTL_MS,
  GITHUB_RELEASE_URL,
  GITHUB_TIMEOUT_MS,
  githubAssetUrl,
  UPDATER_TARGET,
} from './config';
import { findUpdaterAssets, pickInstallers } from './lib';

import type { Release, ReleaseAsset } from '@gnomevpn/schemas';
import type { CachedRelease, GithubRelease, UpdaterManifest } from './release.types';

@Injectable()
export class ReleaseService {
  private readonly logger = new Logger(ReleaseService.name);

  private cached: CachedRelease | null = null;

  constructor(private readonly config: AppConfigService) {}

  private githubHeaders(accept: string): Record<string, string> {
    const token = this.config.get('GITHUB_TOKEN');

    return token ? { Accept: accept, Authorization: `Bearer ${token}` } : { Accept: accept };
  }

  private unavailable(): AppServiceUnavailableException {
    return new AppServiceUnavailableException('INTERNAL_ERROR', 'Release info unavailable');
  }

  private toRelease(data: GithubRelease): Release {
    const apiUrl = this.config.get('API_URL');

    const assets: ReleaseAsset[] = pickInstallers(data.assets).map(({ platform, asset }) => ({
      platform,
      name: asset.name,
      sizeBytes: asset.size,
      downloadUrl: `${apiUrl}/release/download/${asset.id}`,
    }));

    return {
      version: data.tag_name.replace(/^v/, ''),
      htmlUrl: `${this.config.get('CLIENT_URL')}/#download`,
      publishedAt: data.published_at,
      assets,
    };
  }

  private async fetchLatest(): Promise<GithubRelease> {
    if (this.cached && this.cached.expiresAt > Date.now()) {
      return this.cached.value;
    }

    let response: Response;

    try {
      response = await fetch(GITHUB_RELEASE_URL, {
        headers: this.githubHeaders('application/vnd.github+json'),
        signal: AbortSignal.timeout(GITHUB_TIMEOUT_MS),
      });
    } catch (error) {
      this.logger.warn(`GitHub releases unreachable: ${describeError(error)}`);

      throw this.unavailable();
    }

    if (!response.ok) {
      this.logger.warn(`GitHub responded with ${response.status}`);

      throw this.unavailable();
    }

    const release = (await response.json()) as GithubRelease;

    this.cached = { value: release, expiresAt: Date.now() + CACHE_TTL_MS };

    return release;
  }

  async getLatest(): Promise<Release> {
    return this.toRelease(await this.fetchLatest());
  }

  async resolveAssetUrl(assetId: number): Promise<string> {
    let response: Response;

    try {
      response = await fetch(githubAssetUrl(assetId), {
        headers: this.githubHeaders('application/octet-stream'),
        redirect: 'manual',
        signal: AbortSignal.timeout(GITHUB_TIMEOUT_MS),
      });
    } catch (error) {
      this.logger.warn(`GitHub asset ${assetId} unreachable: ${describeError(error)}`);

      throw this.unavailable();
    }

    const location = response.headers.get('location');

    if (!location) {
      this.logger.warn(`GitHub asset ${assetId} answered ${response.status} without a redirect`);

      throw this.unavailable();
    }

    return location;
  }

  private async fetchSignature(assetId: number): Promise<string> {
    const url = await this.resolveAssetUrl(assetId);

    let response: Response;

    try {
      response = await fetch(url, {
        signal: AbortSignal.timeout(GITHUB_TIMEOUT_MS),
      });
    } catch (error) {
      this.logger.warn(`Signature ${assetId} unreachable: ${describeError(error)}`);

      throw this.unavailable();
    }

    if (!response.ok) {
      this.logger.warn(`Signature ${assetId} answered ${response.status}`);

      throw this.unavailable();
    }

    return (await response.text()).trim();
  }

  async getUpdaterManifest(): Promise<UpdaterManifest> {
    const release = await this.fetchLatest();
    const updater = findUpdaterAssets(release.assets);

    if (!updater) {
      this.logger.warn(`Release ${release.tag_name} ships no updater artifacts`);

      throw this.unavailable();
    }

    const apiUrl = this.config.get('API_URL');

    return {
      version: release.tag_name.replace(/^v/, ''),
      notes: release.body ?? '',
      pub_date: release.published_at,
      platforms: {
        [UPDATER_TARGET]: {
          signature: await this.fetchSignature(updater.signature.id),
          url: `${apiUrl}/release/download/${updater.archive.id}`,
        },
      },
    };
  }
}
