import { milliseconds } from 'date-fns';

const INCY_RELEASES = 'https://github.com/INCY-DEV/incy-platforms/releases/latest/download';

export const INCY_DOWNLOADS = {
  ios: 'https://apps.apple.com/app/incy/id6756943388',
  android: 'https://play.google.com/store/apps/details?id=llc.itdev.incy',
  windows: `${INCY_RELEASES}/incy-windows-setup.exe`,
  macos: `${INCY_RELEASES}/incy-macos-arm64.dmg`,
  linux: `${INCY_RELEASES}/incy-linux-x64.deb`,
  tv: 'https://incy.cc/'
} as const;

export const PLATFORMS_CACHE_TTL_MS = milliseconds({ days: 1 });
