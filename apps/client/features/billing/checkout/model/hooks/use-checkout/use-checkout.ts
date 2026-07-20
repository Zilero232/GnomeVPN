import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useErrorMessage } from '@/entities/app/locale';
import { createCheckout } from '@/shared/api';
import { isTauriDesktop, openExternal } from '@/shared/lib';

import type { PlanId } from '@gnomevpn/schemas';

export const useCheckout = () => {
  const errorMessage = useErrorMessage();

  return useMutation({
    mutationFn: (planId: PlanId) => createCheckout(planId, isTauriDesktop() ? 'desktop' : 'web'),
    onSuccess: async (result) => {
      await openExternal(result.confirmationUrl);
    },
    onError: (error: unknown) => toast.error(errorMessage(error)),
  });
};
