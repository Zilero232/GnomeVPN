import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useErrorMessage } from '@/entities/app/locale';
import { createCheckout } from '@/shared/api';

export const useCheckout = () => {
  const errorMessage = useErrorMessage();

  return useMutation({
    mutationFn: createCheckout,
    onSuccess: (result) => {
      window.location.href = result.confirmationUrl;
    },
    onError: (error: unknown) => toast.error(errorMessage(error)),
  });
};
