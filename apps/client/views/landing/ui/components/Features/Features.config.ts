import type { LucideIcon } from 'lucide-react';

import { Globe, Link2, MonitorSmartphone, ShieldOff, Smartphone, Zap } from 'lucide-react';

import type { FeatureCard } from '../../../config';

export const FEATURE_ICONS: Record<FeatureCard, LucideIcon> = {
  protocol: Zap,
  devices: Smartphone,
  platforms: MonitorSmartphone,
  locations: Globe,
  noLogs: ShieldOff,
  openFormat: Link2
};
