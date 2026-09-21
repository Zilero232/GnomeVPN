'use client';

import type { ReactNode } from 'react';

import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { match } from 'ts-pattern';

import { useCurrentUser } from '@/entities/auth/user';
import { isGuestOnlyRoute, isKnownRoute, isPublicRoute, ROUTES } from '@/shared/constants';
import { usePathname, useRouter } from '@/shared/i18n/navigation';
import { AppSplash } from '@/ui-kit';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const t = useTranslations('common');
  const router = useRouter();
  const pathname = usePathname();

  const { isLoading, isAuthenticated } = useCurrentUser();

  const isOpen = isPublicRoute(pathname) || !isKnownRoute(pathname);
  const isGuestOnly = isGuestOnlyRoute(pathname);

  const target = match({ isLoading, isOpen, isGuestOnly, isAuthenticated })
    .with({ isLoading: true }, () => null)
    .with({ isOpen: false, isAuthenticated: false }, () => ROUTES.auth)
    .with({ isGuestOnly: true, isAuthenticated: true }, () => ROUTES.account)
    .otherwise(() => null);

  useEffect(() => {
    if (target) {
      router.replace(target);
    }
  }, [target, router]);

  if (!isOpen && (isLoading || target)) {
    return <AppSplash label={t('loading')} />;
  }

  return children;
};
