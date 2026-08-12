import type { Release, ReleaseAsset } from '@gnomevpn/schemas';

import { Injectable, Logger } from '@nestjs/common';

import type { CachedRelease, GithubRelease, UpdaterManifest } from '../release.types';

import { AppServiceUnavailableException } from '../../../common/exceptions';
import { describeError } from '../../../common/lib';
import { AppConfigService } from '../../../config/config.module';
import { CACHE_TTL_MS, GITHUB_RELEASE_URL, githubAssetUrl, UPDATER_MANIFEST_NAME } from '../config';
import {
  findManifestAsset,
  githubFetch,
  githubReleaseSchema,
  parseManifestBody,
  pickInstallers,
  rewriteManifestUrls,
  updaterManifestSchema
} from '../lib';

@Injectable()
export class ReleaseService {
  private readonly logger = new Logger(ReleaseService.name);

  private cached: CachedRelease | null = null;

  constructor(private readonly config: AppConfigService) {}

  private githubHeaders(accept: string): Record<string, string> {
    const token = this.config.get('GITHUB_TOKEN');

    return token ? { Accept: accept, Authorization: `Bearer ${token}` } : { Accept: accept };
  }

  private unavailable(reason: string): AppServiceUnavailableException {
    this.logger.warn(reason);

    return new AppServiceUnavailableException('INTERNAL_ERROR', 'Release info unavailable');
  }

  private toRelease(data: GithubRelease): Release {
    const apiUrl = this.config.get('API_URL');

    const assets: ReleaseAsset[] = pickInstallers(data.assets).map(({ platform, asset }) => ({
      platform,
      name: asset.name,
      sizeBytes: asset.size,
      downloadUrl: `${apiUrl}/release/download/${asset.id}`
    }));

    return {
      version: data.tag_name.replace(/^v/, ''),
      htmlUrl: `${this.config.get('CLIENT_URL')}/#download`,
      publishedAt: data.published_at,
      assets
    };
  }

  private async fetchLatest(): Promise<GithubRelease> {
    if (this.cached && this.cached.expiresAt > Date.now()) {
      return this.cached.value;
    }

    const pending = this.loadLatest();

    this.cached = { value: pending, expiresAt: Date.now() + CACHE_TTL_MS };

    try {
      return await pending;
    } catch (error) {
      this.cached = null;

      throw error;
    }
  }

  private async loadLatest(): Promise<GithubRelease> {
    const response = await githubFetch({
      url: GITHUB_RELEASE_URL,
      headers: this.githubHeaders('application/vnd.github+json'),
      describe: 'GitHub releases'
    }).catch((error: unknown) => {
      throw this.unavailable(describeError(error));
    });

    const parsed = githubReleaseSchema.safeParse(await response.json());

    if (!parsed.success) {
      throw this.unavailable(`GitHub returned an unexpected release: ${parsed.error.message}`);
    }

    return parsed.data;
  }

  async getLatest(): Promise<Release> {
    return this.toRelease(await this.fetchLatest());
  }

  async resolveAssetUrl(assetId: number): Promise<string> {
    const response = await githubFetch({
      url: githubAssetUrl(assetId),
      headers: this.githubHeaders('application/octet-stream'),
      redirect: 'manual',
      describe: `GitHub asset ${assetId}`
    }).catch((error: unknown) => {
      throw this.unavailable(describeError(error));
    });

    const location = response.headers.get('location');

    if (!location) {
      throw this.unavailable(`GitHub asset ${assetId} answered ${response.status} without a redirect`);
    }

    return location;
  }

  private async fetchAssetBody(assetId: number): Promise<string> {
    const response = await githubFetch({
      url: await this.resolveAssetUrl(assetId),
      describe: `Asset ${assetId}`
    }).catch((error: unknown) => {
      throw this.unavailable(describeError(error));
    });

    return response.text();
  }

  async getUpdaterManifest(): Promise<UpdaterManifest> {
    const release = await this.fetchLatest();
    const asset = findManifestAsset(release.assets);

    if (!asset) {
      throw this.unavailable(`Release ${release.tag_name} ships no ${UPDATER_MANIFEST_NAME}`);
    }

    const body = await this.fetchAssetBody(asset.id);
    const parsed = updaterManifestSchema.safeParse(parseManifestBody(body));

    if (!parsed.success) {
      throw this.unavailable(`Malformed ${UPDATER_MANIFEST_NAME}: ${parsed.error.message}`);
    }

    return rewriteManifestUrls({
      manifest: parsed.data,
      assets: release.assets,
      apiUrl: this.config.get('API_URL')
    });
  }
}
