import type { ReleaseAsset } from '@gnomevpn/schemas';
import type { DownloadPlatformConfig } from '@/entities/app/release';

export type PlatformCardProps = {
  label: string;
  Icon: DownloadPlatformConfig['Icon'];
  asset?: ReleaseAsset;
};
