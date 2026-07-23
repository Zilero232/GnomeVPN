import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useErrorMessage } from '@/entities/app/locale';
import { buyExtraDevices } from '@/shared/api';
import { isTauriDesktop, openExternal } from '@/shared/lib';

export const useBuyExtraDevices = () => {
  const errorMessage = useErrorMessage();

  return useMutation({
    mutationFn: (quantity: number) =>
      buyExtraDevices({ quantity, client: isTauriDesktop() ? 'desktop' : 'web' }),
    onSuccess: async (result) => {
      await openExternal(result.confirmationUrl);
    },
    onError: (error: unknown) => toast.error(errorMessage(error)),
  });
};
