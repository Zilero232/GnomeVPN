import type { ReleasePlatform } from '@gnomevpn/schemas';

import { AppWindow, Smartphone } from 'lucide-react';

export type DownloadPlatformConfig = {
  Icon: typeof AppWindow;
  id: ReleasePlatform;
  labelKey: ReleasePlatform;
};

export const DOWNLOAD_PLATFORMS: DownloadPlatformConfig[] = [
  { id: 'windows', labelKey: 'windows', Icon: AppWindow },
  { id: 'android', labelKey: 'android', Icon: Smartphone }
];
