import { useInvalidateSubscription } from '@/entities/billing/subscription';

import type { SettlePaymentInput } from './use-settle-payment.types';

import { redirectToConfirmation } from '../../checkout.helpers';

export const useSettlePayment = () => {
  const invalidateSubscription = useInvalidateSubscription();

  return async ({ confirmationUrl }: SettlePaymentInput): Promise<void> => {
    if (redirectToConfirmation(confirmationUrl)) {
      return;
    }

    await invalidateSubscription();
  };
};
