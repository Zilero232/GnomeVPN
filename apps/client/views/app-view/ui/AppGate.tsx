'use client';

import { usePlatform } from '@/entities/app/platform';
import { AppSplash } from '@/shared/ui';
import { DesktopOnlyView } from '@/views/desktop-only';

import { AppView } from './AppView';

export const AppGate = () => {
  const { isNativeApp, isReady } = usePlatform();

  if (!isReady) {
    return <AppSplash />;
  }

  return isNativeApp ? <AppView /> : <DesktopOnlyView />;
};
