'use client';

import { SplitSquareHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import type { SplitTunnelingButtonProps } from './SplitTunnelingButton.types';

import { useSplitTunneling } from '../../model/hooks';
import { SplitTunnelingDialog } from '../SplitTunnelingDialog';

import s from './SplitTunnelingButton.module.scss';

export const SplitTunnelingButton = ({ isConnected, hasActiveNode, onReconnect }: SplitTunnelingButtonProps) => {
  const t = useTranslations('splitTunneling');
  const [isOpen, setIsOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);

  const splitTunneling = useSplitTunneling({
    isOpen,
    onApplied: () => {
      if (!isConnected || !hasActiveNode) {
        return;
      }

      onReconnect();
    }
  });

  const { applied } = splitTunneling;
  const count = applied.apps.length + applied.ips.length;

  const open = () => {
    setHasOpened(true);
    setIsOpen(true);
  };

  const close = (next: boolean) => {
    if (!next) {
      splitTunneling.reset();
    }

    setIsOpen(next);
  };

  return (
    <>
      <button aria-label={t('open')} className={s.root} data-active={count > 0} type='button' onClick={open}>
        <SplitSquareHorizontal size={15} />

        {count > 0 && <span className={s.badge}>{count > 9 ? '9+' : count}</span>}
      </button>

      {hasOpened && <SplitTunnelingDialog isConnected={isConnected} isOpen={isOpen} splitTunneling={splitTunneling} onOpenChange={close} />}
    </>
  );
};
