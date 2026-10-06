'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { isNonNullish } from 'remeda';
import { toast } from 'sonner';

import { useToastError } from '@/entities/app/locale';
import { useAccountIdentity } from '@/entities/auth/user';
import { ErrorBlock, LoadingBlock } from '@/ui-kit';

import { useIssueCode, useTelegramStatus, useUnlinkTelegram } from '../model/hooks';
import { TelegramCode, TelegramInvite, TelegramLinked, TelegramUnlinkDialog } from './components';

import s from './TelegramPanel.module.scss';

export const TelegramPanel = () => {
  const t = useTranslations('telegram');
  const toastError = useToastError();
  const issue = useIssueCode();
  const { data: status, isPending, isError, isRefetching, refetch } = useTelegramStatus({ isAwaitingLink: isNonNullish(issue.data) });
  const { hasEmail } = useAccountIdentity();
  const unlink = useUnlinkTelegram();

  const [isUnlinkOpen, setIsUnlinkOpen] = useState(false);

  const onUnlink = () => {
    unlink.mutate(undefined, {
      onSuccess: () => {
        setIsUnlinkOpen(false);
        toast.success(t('unlinked'));
      },
      onError: toastError
    });
  };

  if (isPending) {
    return <LoadingBlock label={t('loading')} />;
  }

  if (isError || !status) {
    return <ErrorBlock isRetrying={isRefetching} message={t('unavailable')} retryLabel={t('retry')} onRetry={() => void refetch()} />;
  }

  if (status.isLinked) {
    return (
      <div className={s.root}>
        <TelegramLinked
          bot={status.botUsername}
          hasEmail={hasEmail}
          isPending={unlink.isPending}
          username={status.username}
          onUnlink={() => setIsUnlinkOpen(true)}
        />

        <TelegramUnlinkDialog isOpen={isUnlinkOpen} isPending={unlink.isPending} onConfirm={onUnlink} onOpenChange={setIsUnlinkOpen} />
      </div>
    );
  }

  const issued = issue.data;

  return (
    <div className={s.root}>
      <TelegramInvite
        isIssued={isNonNullish(issued)}
        isPending={issue.isPending}
        onConnect={() => issue.mutate(undefined, { onError: toastError })}
      />

      {isNonNullish(issued) && <TelegramCode bot={issued.botUsername} code={issued.code} />}
    </div>
  );
};
