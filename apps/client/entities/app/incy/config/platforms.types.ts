import type { Platform } from '@gnomevpn/schemas';
import type { LucideIcon } from 'lucide-react';

export type IncyPlatform = Platform & {
  icon: LucideIcon;
};
