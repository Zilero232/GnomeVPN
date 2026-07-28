import { useMutation } from '@tanstack/react-query';

import { useToastError } from '@/entities/app/locale';
import { buyExtraDevices } from '@/shared/api';
import { clientKind, openExternal } from '@/shared/lib';

export const useBuyExtraDevices = () => {
  const toastError = useToastError();

  return useMutation({
    mutationFn: (quantity: number) => buyExtraDevices({ quantity, client: clientKind() }),
    onSuccess: async (result) => {
      await openExternal(result.confirmationUrl);
    },
    onError: toastError,
  });
};
