'use client';

import { KeyRound, TriangleAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';

import { ResetPasswordForm } from '@/features/auth/reset-password';
import { ROUTES } from '@/shared/constants';
import { useRouter } from '@/shared/i18n/navigation';
import { Button, StatusIcon, Text } from '@/ui-kit';

import s from './ResetPasswordPage.module.scss';

export const ResetPasswordPage = () => {
  const t = useTranslations('auth');
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get('token');

  if (!token) {
    return (
      <div className={s.state}>
        <StatusIcon tone='danger'>
          <TriangleAlert size={22} />
        </StatusIcon>

        <Text as='h1' className={s.title}>
          {t('resetLinkInvalid')}
        </Text>

        <Text align='center' size='sm' tone='muted'>
          {t('resetLinkInvalidHint')}
        </Text>

        <Button variant='ghost' onClick={() => router.replace(ROUTES.auth)}>
          {t('backToSignIn')}
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className={s.head}>
        <StatusIcon>
          <KeyRound size={22} />
        </StatusIcon>

        <Text as='h1' className={s.title}>
          {t('resetPassword')}
        </Text>
      </div>

      <ResetPasswordForm token={token} onDone={() => router.replace(ROUTES.auth)} />
    </>
  );
};
