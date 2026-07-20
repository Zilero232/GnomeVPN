'use client';

import { useTranslations } from 'next-intl';

import { ChangeEmailForm } from '@/features/auth/change-email';
import { ChangePasswordForm } from '@/features/auth/change-password';
import { UpdateNameForm } from '@/features/auth/update-name';

import s from './ProfileCard.module.scss';

export const ProfileCard = () => {
  const t = useTranslations('account.profile');

  return (
    <div className={s.root}>
      <UpdateNameForm />

      <hr className={s.divider} />

      <ChangeEmailForm />

      <hr className={s.divider} />

      <h3 className={s.subtitle}>{t('security')}</h3>

      <ChangePasswordForm />
    </div>
  );
};
