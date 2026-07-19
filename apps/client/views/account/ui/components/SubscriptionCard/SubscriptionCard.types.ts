import type { SubscriptionStatus } from '@gnomevpn/schemas';

export type SubscriptionCardProps = {
  subscription: SubscriptionStatus | null;
  isLoading: boolean;
};
