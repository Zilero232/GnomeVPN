'use client';

import { useTranslations } from 'next-intl';

import { ChangeEmailForm } from '@/features/auth/change-email';
import { ChangePasswordForm } from '@/features/auth/change-password';
import { UpdateNameForm } from '@/features/auth/update-name';
import { Text } from '@/shared/ui';

import s from './ProfileCard.module.scss';

export const ProfileCard = () => {
  const t = useTranslations('account.profile');

  return (
    <div className={s.root}>
      <div className={s.pair}>
        <div className={s.section}>
          <UpdateNameForm />
        </div>

        <div className={s.section}>
          <ChangeEmailForm />
        </div>
      </div>

      <hr className={s.divider} />

      <div className={s.section}>
        <Text as='h3' className={s.subtitle}>
          {t('security')}
        </Text>

        <ChangePasswordForm />
      </div>
    </div>
  );
};
