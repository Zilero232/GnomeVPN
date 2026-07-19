import type { SubscriptionStatus } from '@vesper/schemas';

export type SubscriptionCardProps = {
  subscription: SubscriptionStatus | null;
  isLoading: boolean;
};
