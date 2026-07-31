import type { LucideIcon } from 'lucide-react';

import { Network, Power, RefreshCw, ShieldOff, Smartphone, SplitSquareHorizontal } from 'lucide-react';

import type { FeatureCard } from '../../../config';

export const FEATURE_ICONS: Record<FeatureCard, LucideIcon> = {
  split: SplitSquareHorizontal,
  devices: Smartphone,
  autostart: Power,
  lan: Network,
  noLogs: ShieldOff,
  updates: RefreshCw
};
