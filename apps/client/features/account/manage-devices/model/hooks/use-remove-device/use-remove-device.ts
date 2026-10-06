'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useToastError } from '@/entities/app/locale';
import { removeDevice } from '@/shared/api';
import { QUERY_KEYS } from '@/shared/constants';

export const useRemoveDevice = () => {
  const queryClient = useQueryClient();
  const toastError = useToastError();

  return useMutation({
    mutationFn: (id: string) => removeDevice({ id }),
    onError: toastError,
    onSettled: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.devices() })
  });
};
