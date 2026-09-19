import type { ClientId } from '@gnomevpn/schemas';
import type { LucideIcon } from 'lucide-react';

import { Apple, Cat, Ghost, Rocket, Smartphone, Zap } from 'lucide-react';

export const CLIENT_ICONS: Record<ClientId, LucideIcon> = {
  incy: Rocket,
  hiddify: Ghost,
  v2rayng: Smartphone,
  streisand: Apple,
  nekobox: Cat,
  clashMeta: Zap
};
