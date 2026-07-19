import { useMutation } from '@tanstack/react-query';

import { createCheckout } from '@/shared/api';

export const useCheckout = () => {
  return useMutation({
    mutationFn: createCheckout,
    onSuccess: (result) => {
      window.location.href = result.confirmationUrl;
    },
  });
};
