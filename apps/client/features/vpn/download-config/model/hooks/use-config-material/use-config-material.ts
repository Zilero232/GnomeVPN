import { useCopy } from '@siberiacancode/reactuse';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

import type { ConfigDownload } from '@/shared/api';

import { useToastError } from '@/entities/app/locale';
import { issueConfig, readConfigText } from '@/shared/api';
import { QUERY_KEYS } from '@/shared/constants';
import { saveFile } from '@/shared/lib';

import type { UseConfigMaterialInput } from './use-config-material.types';

export const useConfigMaterial = ({ config }: UseConfigMaterialInput) => {
  const t = useTranslations('configs');
  const queryClient = useQueryClient();
  const toastError = useToastError();
  const { copy } = useCopy();

  const cache = useRef<ConfigDownload | null>(null);
  const [content, setContent] = useState<string | null>(null);

  const { isPending, mutateAsync } = useMutation({
    mutationFn: async (): Promise<ConfigDownload> => {
      if (cache.current) {
        return cache.current;
      }

      const download = await issueConfig({
        nodeId: config.nodeId,
        name: config.name,
        protocol: config.protocol
      });

      cache.current = download;
      setContent(await readConfigText(download.blob));
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.configs() });

      return download;
    },
    onError: toastError
  });

  const download = async () => {
    const { target, fileName } = await saveFile(await mutateAsync());

    if (target === 'shared') {
      return;
    }

    toast.success(t('downloaded', { fileName }), { description: t('savedHint') });
  };

  const copyToClipboard = async () => {
    await copy(await readConfigText((await mutateAsync()).blob));

    toast.success(t('copied'), { description: t('copiedHint') });
  };

  const prepareQr = () => {
    mutateAsync().catch(() => undefined);
  };

  return { content, isPending, download, copyToClipboard, prepareQr };
};
