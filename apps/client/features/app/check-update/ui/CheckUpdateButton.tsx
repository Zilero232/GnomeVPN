'use client';

import { clsx } from 'clsx';
import { RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

import { useUpdateCheck } from '../model/hooks';
import { UpdateDialog } from './components';

import s from './CheckUpdateButton.module.scss';

export const CheckUpdateButton = () => {
  const t = useTranslations('update');
  const { data: update, isFetching, refetch } = useUpdateCheck(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const onClick = async () => {
    const { data, isError } = await refetch();

    if (isError) {
      toast.error(t('failed'));

      return;
    }

    if (data) {
      setIsDialogOpen(true);

      return;
    }

    toast.success(t('upToDate'));
  };

  return (
    <>
      <button className={s.root} disabled={isFetching} type="button" onClick={onClick}>
        <RefreshCw className={clsx(s.icon, isFetching && s.spinning)} size={14} />
        {isFetching ? t('checking') : t('check')}
      </button>

      {update && (
        <UpdateDialog isOpen={isDialogOpen} update={update} onOpenChange={setIsDialogOpen} />
      )}
    </>
  );
};
