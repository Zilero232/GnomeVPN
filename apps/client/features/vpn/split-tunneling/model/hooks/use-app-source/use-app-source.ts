'use client';

import { useEffect, useState } from 'react';

import type { InstalledApp } from '@/shared/lib';

import { listInstalledApps, listRunningProcesses, logger } from '@/shared/lib';

import type { UseAppSourceInput } from './use-app-source.types';

export const useAppSource = ({ source, isOpen }: UseAppSourceInput) => {
  const [apps, setApps] = useState<InstalledApp[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let cancelled = false;

    const load = async () => {
      setIsLoading(true);

      try {
        const loader = source === 'installed' ? listInstalledApps : listRunningProcesses;
        const result = await loader();

        if (!cancelled) {
          setApps(result);
        }
      } catch (error) {
        logger.warn(`cannot list applications: ${String(error)}`);

        if (!cancelled) {
          setApps([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [isOpen, source]);

  return { apps, isLoading };
};
