import type { SubscriptionStatus } from '@gnomevpn/schemas';

import type { BotLocale } from '../../telegram.types';

export type StatusTextInput = Pick<SubscriptionStatus, 'cancelAtPeriodEnd' | 'currentPeriodEnd' | 'limits' | 'plan' | 'status'> & {
  locale: BotLocale;
};
