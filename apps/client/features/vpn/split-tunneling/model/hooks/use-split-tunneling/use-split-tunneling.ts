'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { difference } from 'remeda';

import { MAX_SPLIT_APPS, QUERY_KEYS } from '@/shared/constants';
import { getSplitApps, listInstalledApps, logger, setSplitApps } from '@/shared/lib';

import type { UseSplitTunnelingInput } from './use-split-tunneling.types';

export const useSplitTunneling = ({ onApplied }: UseSplitTunnelingInput = {}) => {
  const [applied, setApplied] = useState<string[]>([]);
  const [draft, setDraft] = useState<string[]>([]);
  const [isApplying, setIsApplying] = useState(false);

  const { data: apps = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.installedApps(),
    queryFn: listInstalledApps,
    staleTime: Number.POSITIVE_INFINITY,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await getSplitApps();

        setApplied(stored);
        setDraft(stored);
      } catch (error) {
        logger.warn(`cannot read split tunneling apps: ${String(error)}`);
      }
    };

    void load();
  }, []);

  const toggle = (path: string) => {
    setDraft((current) => {
      if (current.includes(path)) {
        return current.filter((entry) => entry !== path);
      }

      return current.length >= MAX_SPLIT_APPS ? current : [...current, path];
    });
  };

  const clear = () => setDraft([]);

  const reset = () => setDraft(applied);

  const apply = async () => {
    setIsApplying(true);

    try {
      await setSplitApps(draft);
      await onApplied?.();
      setApplied(draft);

      return true;
    } catch (error) {
      logger.error(`cannot apply split tunneling apps: ${String(error)}`);

      try {
        await setSplitApps(applied);
      } catch (rollbackError) {
        logger.error(`cannot roll split tunneling apps back: ${String(rollbackError)}`);
      }

      return false;
    } finally {
      setIsApplying(false);
    }
  };

  return {
    apps,
    isLoading,
    isApplying,
    isFull: draft.length >= MAX_SPLIT_APPS,
    selected: draft,
    applied,
    isDirty: draft.length !== applied.length || difference(draft, applied).length > 0,
    toggle,
    clear,
    reset,
    apply,
  };
};
