import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useToastError } from '@/entities/app/locale';
import { revokeConfig } from '@/shared/api';
import { QUERY_KEYS } from '@/shared/constants';

export const useRevokeConfig = () => {
  const queryClient = useQueryClient();
  const toastError = useToastError();

  return useMutation({
    mutationFn: revokeConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.configs() });
    },
    onError: toastError
  });
};
