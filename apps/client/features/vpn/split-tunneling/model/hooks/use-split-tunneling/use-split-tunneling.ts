'use client';

import type { SplitConfig, SplitMode } from '@gnomevpn/schemas';

import { useEffect, useState } from 'react';
import { isDeepEqual } from 'remeda';

import { emptySplitConfig, logger, splitSetting } from '@/shared/lib';

import type { UseSplitTunnelingInput } from './use-split-tunneling.types';

const toggleIn = ({ list, value }: { list: string[]; value: string }) =>
  list.includes(value) ? list.filter((entry) => entry !== value) : [...list, value];

export const useSplitTunneling = ({ isOpen = false, onApplied }: UseSplitTunnelingInput = {}) => {
  const [applied, setApplied] = useState<SplitConfig>(emptySplitConfig);
  const [draft, setDraft] = useState<SplitConfig>(emptySplitConfig);
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    let ignore = false;

    const load = async () => {
      try {
        const stored = await splitSetting.get();

        if (ignore) {
          return;
        }

        setApplied(stored);
        setDraft(stored);
      } catch (error) {
        logger.warn(`cannot read split config: ${String(error)}`);
      }
    };

    void load();

    return () => {
      ignore = true;
    };
  }, [isOpen]);

  const setAppsMode = (appsMode: SplitMode) => setDraft((current) => ({ ...current, appsMode }));

  const setIpsMode = (ipsMode: SplitMode) => setDraft((current) => ({ ...current, ipsMode }));

  const toggleApp = (path: string) => setDraft((current) => ({ ...current, apps: toggleIn({ list: current.apps, value: path }) }));

  const addIp = (cidr: string) => setDraft((current) => (current.ips.includes(cidr) ? current : { ...current, ips: [...current.ips, cidr] }));

  const removeIp = (cidr: string) => setDraft((current) => ({ ...current, ips: current.ips.filter((entry) => entry !== cidr) }));

  const clear = () => setDraft(emptySplitConfig());

  const reset = () => setDraft(applied);

  const apply = async () => {
    setIsApplying(true);

    try {
      await splitSetting.set(draft);
      await onApplied?.();
      setApplied(draft);

      return true;
    } catch (error) {
      logger.error(`cannot apply split config: ${String(error)}`);

      try {
        await splitSetting.set(applied);
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
    apply
  };
};
