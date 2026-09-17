import { Apple, Monitor, Smartphone, Tv } from 'lucide-react';

import type { IncyPlatform } from './platforms.types';

export const INCY_PLATFORMS: IncyPlatform[] = [
  { id: 'ios', icon: Apple, href: 'https://apps.apple.com/app/incy/id6756943388' },
  { id: 'android', icon: Smartphone, href: 'https://play.google.com/store/apps/details?id=llc.itdev.incy' },
  { id: 'desktop', icon: Monitor, href: 'https://github.com/INCY-DEV/incy-platforms/releases/latest' },
  { id: 'tv', icon: Tv, href: 'https://incy.cc/' }
];
