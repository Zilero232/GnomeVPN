'use client';

import { Send, TriangleAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { useRedeemLogin } from '@/features/auth/telegram-sign-in';
import { ROUTES } from '@/shared/constants';
import { useRouter } from '@/shared/i18n/navigation';
import { Button, Spinner, StatusIcon, Text } from '@/ui-kit';

import s from './TelegramSignInPage.module.scss';

export const TelegramSignInPage = () => {
  const t = useTranslations('auth');
  const router = useRouter();
  const { hasFailed } = useRedeemLogin();

  if (hasFailed) {
    return (
      <div className={s.state}>
        <StatusIcon tone='danger'>
          <TriangleAlert size={22} />
        </StatusIcon>

        <Text as='h1' className={s.title}>
          {t('telegramSignInFailed')}
        </Text>

        <Text align='center' size='sm' tone='muted'>
          {t('telegramSignInHint')}
        </Text>

        <Button variant='ghost' onClick={() => router.replace(ROUTES.auth)}>
          {t('backToSignIn')}
        </Button>
      </div>
    );
  }

  return (
    <div className={s.state}>
      <StatusIcon>
        <Send size={22} />
      </StatusIcon>

      <Text as='h1' className={s.title}>
        {t('telegramSignIn')}
      </Text>

      <span className={s.pending}>
        <Spinner />

        <Text size='sm' tone='muted'>
          {t('telegramSignInPending')}
        </Text>
      </span>
    </div>
  );
};
