'use client';

import type { ReactNode } from 'react';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { match } from 'ts-pattern';

import { usePlatform } from '@/entities/app/platform';
import { useCurrentUser } from '@/entities/auth/user';
import { isGuestOnlyRoute, isKnownRoute, isPublicRoute, isWebOnlyRoute, ROUTES } from '@/shared/constants';
import { AppSplash } from '@/shared/ui';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();

  const { isNativeApp, isReady } = usePlatform();
  const { isLoading, isAuthenticated } = useCurrentUser();

  const isPending = isLoading || !isReady;

  const isOpen = isPublicRoute(pathname) || !isKnownRoute(pathname);
  const isGuestOnly = isGuestOnlyRoute(pathname);
  const isWebOnly = isNativeApp && isWebOnlyRoute(pathname);
  const home = isNativeApp ? ROUTES.app : ROUTES.account;

  const target = match({
    isPending,
    isOpen,
    isGuestOnly,
    isWebOnly,
    isAuthenticated
  })
    .with({ isPending: true }, () => null)
    .with({ isWebOnly: true }, () => home)
    .with({ isOpen: false, isAuthenticated: false }, () => ROUTES.auth)
    .with({ isGuestOnly: true, isAuthenticated: true }, () => home)
    .otherwise(() => null);

  useEffect(() => {
    if (target) {
      router.replace(target);
    }
  }, [target, router]);

  if (isWebOnly || (!isOpen && (isPending || target))) {
    return <AppSplash />;
  }

  return children;
};
