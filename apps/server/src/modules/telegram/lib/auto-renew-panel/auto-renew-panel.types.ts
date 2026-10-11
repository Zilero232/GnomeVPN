import type { SubscriptionStatus } from '@gnomevpn/schemas';

import type { BotLocale } from '../../telegram.types';

export type AutoRenewPanelInput = {
  status: Pick<
    SubscriptionStatus,
    'cancelAtPeriodEnd' | 'currentPeriodEnd' | 'hasPaymentMethod' | 'isRecurringAvailable' | 'isTrialAvailable' | 'period'
  >;
  locale: BotLocale;
};
