'use client';

import { Send } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Script from 'next/script';

import { Button, Text } from '@/ui-kit';

import { TELEGRAM_LOGIN, useTelegramLogin } from '../../model/hooks';

import s from './TelegramLoginButton.module.scss';

export const TelegramLoginButton = () => {
  const t = useTranslations('auth');
  const { isReady, isPending, isError, onScriptLoad, onScriptError, signIn } = useTelegramLogin();

  return (
    <>
      <Script id={TELEGRAM_LOGIN.scriptId} src={TELEGRAM_LOGIN.scriptUrl} onError={onScriptError} onLoad={onScriptLoad} />

      {isReady && (
        <div className={s.root}>
          <span className={s.divider}>
            <Text size='xs' tone='muted'>
              {t('orContinueWith')}
            </Text>
          </span>

          <Button disabled={isPending} type='button' variant='ghost' onClick={signIn}>
            <Send aria-hidden size={16} />
            {t('telegramSignInAction')}
          </Button>

          {isError && (
            <Text align='center' size='sm' tone='danger'>
              {t('telegramSignInFailed')}
            </Text>
          )}
        </div>
      )}
    </>
  );
};
