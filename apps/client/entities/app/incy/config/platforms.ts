import type { PlatformId } from '@gnomevpn/schemas';
import type { LucideIcon } from 'lucide-react';

import { Apple, Laptop, Monitor, MonitorSmartphone, Smartphone, Tv } from 'lucide-react';

export const PLATFORM_ICONS: Record<PlatformId, LucideIcon> = {
  ios: Apple,
  android: Smartphone,
  windows: Monitor,
  macos: Laptop,
  linux: MonitorSmartphone,
  tv: Tv
};
