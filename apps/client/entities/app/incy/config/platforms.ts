import { Apple, Laptop, Monitor, Smartphone, Tv } from 'lucide-react';

import type { IncyPlatform } from './platforms.types';

const RELEASES = 'https://github.com/INCY-DEV/incy-platforms/releases/latest/download';

export const INCY_PLATFORMS: IncyPlatform[] = [
  { id: 'ios', icon: Apple, href: 'https://apps.apple.com/app/incy/id6756943388' },
  { id: 'android', icon: Smartphone, href: 'https://play.google.com/store/apps/details?id=llc.itdev.incy' },
  { id: 'windows', icon: Monitor, href: `${RELEASES}/incy-windows-setup.exe` },
  { id: 'macos', icon: Laptop, href: `${RELEASES}/incy-macos-arm64.dmg` },
  { id: 'linux', icon: Monitor, href: `${RELEASES}/incy-linux-x64.deb` },
  { id: 'tv', icon: Tv, href: 'https://incy.cc/' }
];
