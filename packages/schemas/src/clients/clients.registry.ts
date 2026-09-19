import type { ClientEntry, ClientId } from './clients.types';

import { CLIENT_IMPORT_STYLE } from './clients.constants';

const INCY_RELEASES = 'https://github.com/INCY-DEV/incy-platforms/releases/latest/download';

// Only Hiddify, v2rayNG and Clash Meta document an import scheme. Streisand and
// NekoBox have none, so they carry no importUrl and the user pastes the link by
// hand — a made-up scheme would open nothing and look like a broken button.
export const CLIENT_REGISTRY: Record<ClientId, ClientEntry> = {
  incy: {
    downloadUrl: 'https://incy.cc/',
    platforms: ['ios', 'android', 'windows', 'macos', 'linux', 'tv'],
    isRecommended: true,
    import: null
  },
  hiddify: {
    downloadUrl: 'https://hiddify.com/',
    platforms: ['ios', 'android', 'windows', 'macos', 'linux'],
    isRecommended: false,
    import: { prefix: 'hiddify://import/', style: CLIENT_IMPORT_STYLE.path }
  },
  v2rayng: {
    downloadUrl: 'https://github.com/2dust/v2rayNG/releases/latest',
    platforms: ['android'],
    isRecommended: false,
    import: { prefix: 'v2rayng://install-sub?url=', style: CLIENT_IMPORT_STYLE.query }
  },
  clashMeta: {
    downloadUrl: 'https://github.com/MetaCubeX/ClashMetaForAndroid/releases/latest',
    platforms: ['android'],
    isRecommended: false,
    import: { prefix: 'clash://install-config?url=', style: CLIENT_IMPORT_STYLE.query }
  },
  streisand: {
    downloadUrl: 'https://apps.apple.com/app/streisand/id6450534064',
    platforms: ['ios', 'macos'],
    isRecommended: false,
    import: null
  },
  nekobox: {
    downloadUrl: 'https://github.com/MatsuriDayo/NekoBoxForAndroid/releases/latest',
    platforms: ['android'],
    isRecommended: false,
    import: null
  }
};

export const INCY_DOWNLOADS = {
  ios: 'https://apps.apple.com/app/incy/id6756943388',
  android: 'https://play.google.com/store/apps/details?id=llc.itdev.incy',
  windows: `${INCY_RELEASES}/incy-windows-setup.exe`,
  macos: `${INCY_RELEASES}/incy-macos-arm64.dmg`,
  linux: `${INCY_RELEASES}/incy-linux-x64.deb`,
  tv: 'https://incy.cc/'
} as const;
