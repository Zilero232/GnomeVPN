'use client';

import { useTranslations } from 'next-intl';

import { useAccountIdentity } from '@/entities/auth/user';
import { Avatar, Text } from '@/ui-kit';

import s from './AccountIdentity.module.scss';

export const AccountIdentity = () => {
  const t = useTranslations('account');
  const { email, hasEmail, avatarSeed } = useAccountIdentity();

  return (
    <div className={s.root}>
      <Avatar seed={avatarSeed} />

      <div className={s.who}>
        <Text as='h1' className={s.title}>
          {t('title')}
        </Text>

        <Text size='xs' tone='muted'>
          {hasEmail ? email : t('profile.noEmail')}
        </Text>
      </div>
    </div>
  );
};
