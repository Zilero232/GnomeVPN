'use client';

import { getCurrent, onOpenUrl } from '@tauri-apps/plugin-deep-link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { isTauriDesktop, logger } from '@/shared/lib';

import { routeForDeepLink } from './use-deep-link.lib';

export const useDeepLink = () => {
  const router = useRouter();

  useEffect(() => {
    if (!isTauriDesktop()) {
      return;
    }

    let cancelled = false;
    let unlisten: (() => void) | null = null;

    const go = (urls: string[] | null) => {
      const route = routeForDeepLink(urls);

      if (route) {
        router.replace(route);
      }
    };

    const subscribe = async () => {
      try {
        go(await getCurrent());

        const off = await onOpenUrl(go);

        if (cancelled) {
          off();
        } else {
          unlisten = off;
        }
      } catch (error) {
        logger.error(`deep link subscribe failed: ${String(error)}`);
      }
    };

    subscribe();

    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, [router]);
};
