import type { DeviceList, SubscriptionStatus } from '@gnomevpn/schemas';

import type { BotLocale } from '../../telegram.types';

export type DevicesViewInput = {
  list: DeviceList;
  status: Pick<SubscriptionStatus, 'limits' | 'period'>;
  locale: BotLocale;
  notice?: string;
};
