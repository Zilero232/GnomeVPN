'use client';

import { useEffect } from 'react';

import { usePlatform } from '@/entities/app/platform';
import { useDeepLink } from '@/features/app/deep-link';
import { TitleBar } from '@/widgets/app/title-bar';

import type { ReactNode } from 'react';

export const DesktopShell = ({ children }: { children: ReactNode }) => {
  const { isDesktopApp, isReady } = usePlatform();

  useDeepLink();

  useEffect(() => {
    if (isReady) {
      document.documentElement.dataset.desktopApp = String(isDesktopApp);
    }
  }, [isDesktopApp, isReady]);

  return (
    <>
      {isDesktopApp && <TitleBar />}
      {children}
    </>
  );
};
