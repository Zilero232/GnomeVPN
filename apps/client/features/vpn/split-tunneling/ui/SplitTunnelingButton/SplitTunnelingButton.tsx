'use client';

import { SplitSquareHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { useVpnConnectionContext } from '@/features/vpn/connect';
import { useSplitTunneling } from '../../model/hooks';
import { SplitTunnelingDialog } from '../SplitTunnelingDialog';

import s from './SplitTunnelingButton.module.scss';

export const SplitTunnelingButton = () => {
  const t = useTranslations('splitTunneling');
  const [isOpen, setIsOpen] = useState(false);
  const { status, activeNodeId, connect, disconnect } = useVpnConnectionContext();

  const isConnected = status === 'connected';

  const splitTunneling = useSplitTunneling({
    onApplied: async () => {
      if (!isConnected || !activeNodeId) {
        return;
      }

      await disconnect({ isAutomatic: true });
      await connect({ nodeId: activeNodeId, isAutomatic: true });
    },
  });

  const count = splitTunneling.applied.length;

  const close = (open: boolean) => {
    if (!open) {
      splitTunneling.reset();
    }

    setIsOpen(open);
  };

  return (
    <>
      <button
        aria-label={t('open')}
        className={s.root}
        data-active={count > 0}
        type="button"
        onClick={() => setIsOpen(true)}
      >
        <SplitSquareHorizontal size={15} />

        {count > 0 && <span className={s.badge}>{count > 9 ? '9+' : count}</span>}
      </button>

      <SplitTunnelingDialog
        isConnected={isConnected}
        isOpen={isOpen}
        splitTunneling={splitTunneling}
        onOpenChange={close}
      />
    </>
  );
};
