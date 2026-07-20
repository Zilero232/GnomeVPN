'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { LocaleSwitcher } from '@/features/app/switch-locale';
import { ResetPasswordForm } from '@/features/auth/reset-password';
import { ROUTES } from '@/shared/constants';
import { BrandMark, Text } from '@/shared/ui';

import s from './ResetPasswordPage.module.scss';

export const ResetPasswordPage = () => {
  const t = useTranslations('auth');
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get('token');

  return (
    <main className={s.root}>
      <div className={s.panel}>
        <div className={s.head}>
          <BrandMark />
          <LocaleSwitcher />
        </div>

        <h1 className={s.title}>{t('resetPassword')}</h1>

        {token ? (
          <ResetPasswordForm token={token} onDone={() => router.replace(ROUTES.auth)} />
        ) : (
          <div className={s.invalid}>
            <Text align="center" size="sm" tone="muted">
              {t('resetLinkInvalid')}
            </Text>

            <button className={s.back} type="button" onClick={() => router.replace(ROUTES.auth)}>
              {t('backToSignIn')}
            </button>
          </div>
        )}
      </div>
    </main>
  );
};
