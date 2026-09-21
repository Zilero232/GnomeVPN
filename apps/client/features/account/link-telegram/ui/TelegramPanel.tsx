'use client';

import { useTranslations } from 'next-intl';
import { isNonNullish } from 'remeda';
import { toast } from 'sonner';

import { Button, Spinner, Text } from '@/ui-kit';

import { useIssueCode, useTelegramStatus, useUnlinkTelegram } from '../model/hooks';
import { TelegramCode, TelegramInvite, TelegramLinked } from './components';

import s from './TelegramPanel.module.scss';

export const TelegramPanel = () => {
  const t = useTranslations('telegram');
  const tErrors = useTranslations('errors');
  const issue = useIssueCode();
  const { data: status, isPending, isError, refetch } = useTelegramStatus({ isAwaitingLink: isNonNullish(issue.data) });
  const unlink = useUnlinkTelegram();

  const onError = (error: Error) => toast.error(tErrors(error.message));

  const onUnlink = () => {
    unlink.mutate(undefined, { onSuccess: () => toast.success(t('unlinked')), onError });
  };

  if (isPending) {
    return (
      <div className={s.loading}>
        <Spinner />
      </div>
    );
  }

  if (isError || !status) {
    return (
      <div className={s.root}>
        <Text as='p' size='sm' tone='muted'>
          {t('unavailable')}
        </Text>

        <Button className={s.action} variant='ghost' onClick={() => void refetch()}>
          {t('retry')}
        </Button>
      </div>
    );
  }

  if (status.isLinked) {
    return (
      <div className={s.root}>
        <TelegramLinked isPending={unlink.isPending} username={status.username} onUnlink={onUnlink} />
      </div>
    );
  }

  const issued = issue.data;

  return (
    <div className={s.root}>
      <TelegramInvite isIssued={isNonNullish(issued)} isPending={issue.isPending} onConnect={() => issue.mutate(undefined, { onError })} />

      {isNonNullish(issued) && <TelegramCode bot={issued.botUsername} code={issued.code} />}
    </div>
  );
};
