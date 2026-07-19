'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { match } from 'ts-pattern';

import { usePlatform } from '@/entities/app/platform';
import { useCurrentUser } from '@/entities/auth/user';
import { isGuestOnlyRoute, isKnownRoute, isPublicRoute, ROUTES } from '@/shared/constants';

import type { ReactNode } from 'react';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();

  const { isDesktopApp, isReady } = usePlatform();
  const { isLoading, isAuthenticated } = useCurrentUser();

  const isOpen = isPublicRoute(pathname) || !isKnownRoute(pathname);
  const isGuestOnly = isGuestOnlyRoute(pathname);
  const home = isDesktopApp ? ROUTES.app : ROUTES.account;

  const target = match({
    isPending: isLoading || !isReady,
    isOpen,
    isGuestOnly,
    isAuthenticated,
  })
    .with({ isPending: true }, () => null)
    .with({ isOpen: false, isAuthenticated: false }, () => ROUTES.auth)
    .with({ isGuestOnly: true, isAuthenticated: true }, () => home)
    .otherwise(() => null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: redirect must fire only on target change; router is a stable ref
  useEffect(() => {
    if (target) {
      router.replace(target);
    }
  }, [target]);

  if (!isOpen && (isLoading || !isReady || target)) {
    return null;
  }

  return children;
};
