'use client';

import { clsx } from 'clsx';
import { RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { useCheckUpdate } from '../model/use-check-update';

import s from './CheckUpdateButton.module.scss';

export const CheckUpdateButton = () => {
  const t = useTranslations('update');
  const { isPending, mutate } = useCheckUpdate();

  const onClick = () => {
    mutate(undefined, {
      onSuccess: (version) => {
        if (!version) {
          toast.success(t('upToDate'));
        }
      },
      onError: () => toast.error(t('failed')),
    });
  };

  return (
    <button className={s.root} disabled={isPending} type="button" onClick={onClick}>
      <RefreshCw className={clsx(s.icon, isPending && s.spinning)} size={14} />
      {isPending ? t('checking') : t('check')}
    </button>
  );
};
