import type { ClientPlatform } from '@gnomevpn/schemas';

export const ORGANIZATION_LOGO = '/brand/icon-512.png';

export const PLATFORM_LABELS: Record<ClientPlatform, string> = {
  ios: 'iOS',
  android: 'Android',
  windows: 'Windows',
  macos: 'macOS',
  linux: 'Linux',
  tv: 'Android TV'
};
