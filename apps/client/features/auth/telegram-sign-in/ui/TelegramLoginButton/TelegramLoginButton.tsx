'use client';

import { useTranslations } from 'next-intl';

import { Spinner, Text } from '@/ui-kit';

import { useTelegramLogin } from '../../model/hooks';

import s from './TelegramLoginButton.module.scss';

export const TelegramLoginButton = () => {
  const t = useTranslations('auth');
  const { slotRef, isUnreachable, isPending, isError } = useTelegramLogin();

  if (isUnreachable) {
    return null;
  }

  return (
    <div className={s.root}>
      <span className={s.divider}>
        <Text size='xs' tone='muted'>
          {t('orContinueWith')}
        </Text>
      </span>

      <div ref={slotRef} className={s.slot} />

      {isPending && (
        <span className={s.pending}>
          <Spinner />

          <Text size='sm' tone='muted'>
            {t('telegramSignInPending')}
          </Text>
        </span>
      )}

      {isError && (
        <Text align='center' size='sm' tone='danger'>
          {t('telegramSignInFailed')}
        </Text>
      )}
    </div>
  );
};
