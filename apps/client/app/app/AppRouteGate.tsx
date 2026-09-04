'use client';

import { usePlatform } from '@/entities/app/platform';
import { AppSplash } from '@/shared/ui';
import { AppView } from '@/views/app-view';
import { DesktopOnlyView } from '@/views/desktop-only';

export const AppRouteGate = () => {
  const { isNativeApp, isReady } = usePlatform();

  if (!isReady) {
    return <AppSplash />;
  }

  return isNativeApp ? <AppView /> : <DesktopOnlyView />;
};
