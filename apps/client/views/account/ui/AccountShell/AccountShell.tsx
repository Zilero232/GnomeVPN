'use client';

import type { ReactNode } from 'react';

import { useTranslations } from 'next-intl';

import { useCurrentUser } from '@/entities/auth/user';
import { useHydrated } from '@/shared/lib';
import { AppSplash } from '@/ui-kit';

import { AccountAura, AccountNav } from '../components';

import s from './AccountShell.module.scss';

export const AccountShell = ({ children }: { children: ReactNode }) => {
  const t = useTranslations('common');
  const { isLoading, isAuthenticated } = useCurrentUser();
  const isHydrated = useHydrated();

  const isPending = isHydrated && (isLoading || !isAuthenticated);

  return (
    <>
      <AccountAura />

      <div className={s.root}>
        <AccountNav />

        {children}
      </div>

      {isPending && (
        <div className={s.overlay}>
          <AppSplash label={t('loading')} />
        </div>
      )}
    </>
  );
};
