'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { match } from 'ts-pattern';

import { usePlatform } from '@/entities/app/platform';
import { useCurrentUser } from '@/entities/auth/user';
import { isGuestOnlyRoute, isKnownRoute, isPublicRoute, ROUTES } from '@/shared/constants';
import { AppSplash } from '@/shared/ui';

import type { ReactNode } from 'react';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();

  const { isNativeApp, isReady } = usePlatform();
  const { isLoading, isAuthenticated } = useCurrentUser();

  const hasResolvedRef = useRef(false);

  if (!isLoading && isReady) {
    hasResolvedRef.current = true;
  }

  const isPending = (isLoading || !isReady) && !hasResolvedRef.current;

  const isOpen = isPublicRoute(pathname) || !isKnownRoute(pathname);
  const isGuestOnly = isGuestOnlyRoute(pathname);
  const home = isNativeApp ? ROUTES.app : ROUTES.account;

  const target = match({
    isPending,
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

  if (!isOpen && (isPending || target)) {
    return <AppSplash />;
  }

  return children;
};
