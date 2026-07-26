'use client';

import { gt, valid } from 'semver';

import { usePlatform } from '@/entities/app/platform';
import { useRelease } from '@/entities/app/release';
import { env } from '@/shared/config';

import type { MobileUpdate } from './use-mobile-update.types';

export const useMobileUpdate = (): MobileUpdate => {
  const { isMobileApp: isMobile } = usePlatform();
  const { data: release } = useRelease(isMobile);

  const current = valid(env.NEXT_PUBLIC_APP_VERSION);
  const latest = valid(release?.version.replace(/^v/, '') ?? null);

  if (!isMobile || !current || !latest || !gt(latest, current)) {
    return { hasUpdate: false };
  }

  return { hasUpdate: true, version: latest };
};
