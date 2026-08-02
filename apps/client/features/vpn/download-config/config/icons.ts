import { Laptop, Monitor, Router, Shield, Smartphone, Tablet, Tv, Zap } from 'lucide-react';

import type { DevicePresetIcon } from '@/entities/vpn/device';
import type { ProtocolIcon } from '@/entities/vpn/protocol';

export const DEVICE_ICON: Record<DevicePresetIcon, typeof Smartphone> = {
  smartphone: Smartphone,
  laptop: Laptop,
  tablet: Tablet,
  monitor: Monitor,
  router: Router,
  tv: Tv
};

export const PROTOCOL_ICON: Record<ProtocolIcon, typeof Zap> = {
  zap: Zap,
  shield: Shield
};
