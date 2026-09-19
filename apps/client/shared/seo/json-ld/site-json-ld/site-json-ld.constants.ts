import type { ClientPlatform } from '@gnomevpn/schemas';

export const PLATFORM_LABELS: Record<ClientPlatform, string> = {
  ios: 'iOS',
  android: 'Android',
  windows: 'Windows',
  macos: 'macOS',
  linux: 'Linux',
  tv: 'Android TV'
};
