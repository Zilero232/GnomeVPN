'use client';

import { useEffect, useState } from 'react';
import { isDeepEqual } from 'remeda';

import { emptySplitConfig, getSplitConfig, logger, setSplitConfig } from '@/shared/lib';

import type { SplitConfig, SplitMode } from '@gnomevpn/schemas';
import type { UseSplitTunnelingInput } from './use-split-tunneling.types';

const toggleIn = (list: string[], value: string): string[] =>
  list.includes(value) ? list.filter((entry) => entry !== value) : [...list, value];

export const useSplitTunneling = ({ onApplied }: UseSplitTunnelingInput = {}) => {
  const [applied, setApplied] = useState<SplitConfig>(emptySplitConfig);
  const [draft, setDraft] = useState<SplitConfig>(emptySplitConfig);
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await getSplitConfig();

        setApplied(stored);
        setDraft(stored);
      } catch (error) {
        logger.warn(`cannot read split config: ${String(error)}`);
      }
    };

    void load();
  }, []);

  const setAppsMode = (appsMode: SplitMode) => setDraft((current) => ({ ...current, appsMode }));

  const setIpsMode = (ipsMode: SplitMode) => setDraft((current) => ({ ...current, ipsMode }));

  const toggleApp = (path: string) =>
    setDraft((current) => ({ ...current, apps: toggleIn(current.apps, path) }));

  const addIp = (cidr: string) =>
    setDraft((current) =>
      current.ips.includes(cidr) ? current : { ...current, ips: [...current.ips, cidr] },
    );

  const removeIp = (cidr: string) =>
    setDraft((current) => ({ ...current, ips: current.ips.filter((entry) => entry !== cidr) }));

  const clear = () => setDraft(emptySplitConfig());

  const reset = () => setDraft(applied);

  const apply = async () => {
    setIsApplying(true);

    try {
      await setSplitConfig(draft);
      await onApplied?.();
      setApplied(draft);

      return true;
    } catch (error) {
      logger.error(`cannot apply split config: ${String(error)}`);

      try {
        await setSplitConfig(applied);
      } catch (rollbackError) {
        logger.error(`cannot roll split config back: ${String(rollbackError)}`);
      }

      return false;
    } finally {
      setIsApplying(false);
    }
  };

  return {
    draft,
    applied,
    isApplying,
    isDirty: !isDeepEqual(draft, applied),
    setAppsMode,
    setIpsMode,
    toggleApp,
    addIp,
    removeIp,
    clear,
    reset,
    apply,
  };
};
