import { AppWindow, Terminal } from 'lucide-react';

import type { ReleasePlatform } from '@gnomevpn/schemas';

export type DownloadPlatformConfig = {
  Icon: typeof AppWindow;
  id: ReleasePlatform;
  labelKey: 'linux' | 'windows';
};

export const DOWNLOAD_PLATFORMS: DownloadPlatformConfig[] = [
  { id: 'windows', labelKey: 'windows', Icon: AppWindow },
  { id: 'linux', labelKey: 'linux', Icon: Terminal },
];
