// Google will not read an SVG as an organisation logo; this is rendered from
// the same mark by `bun run brand:icons`.
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
