import type { ReleasePlatform } from '@gnomevpn/schemas';

import { Apple, AppWindow, Monitor, Smartphone } from 'lucide-react';

export type DownloadPlatformKind = 'desktop' | 'mobile';

export type DownloadPlatformConfig = {
  Icon: typeof AppWindow;
  id: ReleasePlatform;
  kind: DownloadPlatformKind;
  labelKey: ReleasePlatform;
};

export const DOWNLOAD_PLATFORM_KINDS: DownloadPlatformKind[] = ['desktop', 'mobile'];

export const DOWNLOAD_PLATFORMS: DownloadPlatformConfig[] = [
  { id: 'windows', labelKey: 'windows', kind: 'desktop', Icon: AppWindow },
  { id: 'macos', labelKey: 'macos', kind: 'desktop', Icon: Apple },
  { id: 'linux', labelKey: 'linux', kind: 'desktop', Icon: Monitor },
  { id: 'android', labelKey: 'android', kind: 'mobile', Icon: Smartphone }
];
