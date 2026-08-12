import type { DownloadedConfig } from '@gnomevpn/schemas';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { useToastError } from '@/entities/app/locale';
import { revokeConfig } from '@/shared/api';
import { QUERY_KEYS } from '@/shared/constants';

export const useRevokeConfig = () => {
  const t = useTranslations('configs');
  const queryClient = useQueryClient();
  const toastError = useToastError();

  return useMutation({
    mutationFn: revokeConfig,
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.configs() });

      const previous = queryClient.getQueryData<DownloadedConfig[]>(QUERY_KEYS.configs());

      queryClient.setQueryData<DownloadedConfig[]>(QUERY_KEYS.configs(), (configs) => configs?.filter((config) => config.id !== id));

      return { previous };
    },
    onSuccess: () => {
      toast.success(t('revoked'));
    },
    onError: (error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEYS.configs(), context.previous);
      }

      toastError(error);
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.configs() }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.configStatus() })
      ]);
    }
  });
};
