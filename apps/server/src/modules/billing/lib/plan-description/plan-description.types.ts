import type { Plan } from '@gnomevpn/schemas';

import type { SUBSCRIPTION_PREFIX } from '../../config';

export type SubscriptionKind = keyof typeof SUBSCRIPTION_PREFIX;

export type DescribeSubscriptionInput = {
  plan: Plan;
  kind: SubscriptionKind;
};
