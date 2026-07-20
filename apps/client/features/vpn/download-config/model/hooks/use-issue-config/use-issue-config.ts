import { useMutation, useQueryClient } from '@tanstack/react-query';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';

import { useErrorMessage } from '@/entities/app/locale';
import { issueConfig } from '@/shared/api';
import { QUERY_KEYS } from '@/shared/constants';

export const useIssueConfig = () => {
  const queryClient = useQueryClient();
  const errorMessage = useErrorMessage();

  return useMutation({
    mutationFn: issueConfig,
    onSuccess: (download) => {
      saveAs(download.blob, download.fileName);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.configs() });
    },
    onError: (error: unknown) => toast.error(errorMessage(error)),
  });
};
