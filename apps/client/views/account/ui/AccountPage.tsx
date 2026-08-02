'use client';

import { CreditCard, FileKey, LogOut, UserRound } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';

import { useAvatarSeed, useCurrentUser } from '@/entities/auth/user';
import { useSubscriptionStatus } from '@/entities/billing/subscription';
import { useSignOut } from '@/features/auth/sign-out';
import { ConfigList } from '@/features/vpn/download-config';
import { Avatar, Text } from '@/shared/ui';

import type { AccountTab } from './components';

import { BLOCK_MOTION, HEADER_MOTION, PAGE_MOTION } from './AccountPage.motion';
import { AccountAura, AccountNav, AccountTabs, ProfileCard, SubscriptionCard } from './components';

import s from './AccountPage.module.scss';

export const AccountPage = () => {
  const t = useTranslations('account');
  const tConfigs = useTranslations('configs');
  const { email, name } = useCurrentUser();
  const { subscription, isLoading } = useSubscriptionStatus();

  const avatarSeed = useAvatarSeed({ fallback: email });
  const signOut = useSignOut();

  const tabs: AccountTab[] = [
    {
      value: 'subscription',
      label: t('tabs.subscription'),
      icon: CreditCard,
      content: <SubscriptionCard isLoading={isLoading} subscription={subscription} />
    },
    {
      value: 'configs',
      label: tConfigs('title'),
      icon: FileKey,
      content: <ConfigList />,
      isBare: true
    },
    {
      value: 'profile',
      label: t('profile.title'),
      icon: UserRound,
      content: <ProfileCard />
    }
  ];

  return (
    <>
      <AccountAura />

      <motion.main animate='visible' className={s.root} initial='hidden' variants={PAGE_MOTION}>
        <motion.div variants={BLOCK_MOTION}>
          <AccountNav />
        </motion.div>

        <motion.header className={s.header} variants={HEADER_MOTION}>
          <div className={s.identity}>
            <Avatar alt={name || email} seed={avatarSeed} />

            <div className={s.who}>
              <Text as='h1' className={s.title}>
                {t('title')}
              </Text>

              <Text size='xs' tone='muted'>
                {email}
              </Text>
            </div>
          </div>

          <button className={s.signOut} disabled={signOut.isPending} type='button' onClick={() => signOut.mutate()}>
            <LogOut aria-hidden size={15} />
            {t('signOut')}
          </button>
        </motion.header>

        <motion.div className={s.body} variants={BLOCK_MOTION}>
          <AccountTabs items={tabs} panelClassName={s.card} />
        </motion.div>
      </motion.main>
    </>
  );
};
