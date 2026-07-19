'use client';

import { clsx } from 'clsx';
import { Power } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslations } from 'next-intl';

import { HALO_MOTION, haloTransition, RING_MOTION } from './ConnectButton.motion';

import s from './ConnectButton.module.scss';

import type { VpnConnectionStatus } from '../model/hooks/use-vpn-connection';
import type { ConnectButtonProps } from './ConnectButton.types';

const LABEL_KEYS: Record<VpnConnectionStatus, string> = {
  disconnected: 'connect',
  connecting: 'connecting',
  connected: 'disconnect',
};

const HALO_DELAYS = [0, 1.4];

export const ConnectButton = ({ status, disabled, onToggle }: ConnectButtonProps) => {
  const t = useTranslations('app');

  const isIdle = status === 'disconnected' && !disabled;

  return (
    <div className={s.wrap}>
      <motion.span animate={status} className={clsx(s.ring, s.ringOuter)} variants={RING_MOTION} />
      <motion.span animate={status} className={s.ring} variants={RING_MOTION} />

      <AnimatePresence>
        {isIdle &&
          HALO_DELAYS.map((delay) => (
            <motion.span
              className={s.halo}
              exit={{ opacity: 0, transition: { duration: 0.25 } }}
              key={delay}
              transition={haloTransition(delay)}
              {...HALO_MOTION}
            />
          ))}
      </AnimatePresence>

      <motion.button
        className={clsx(s.root, s[status])}
        disabled={disabled || status === 'connecting'}
        transition={{ type: 'spring', stiffness: 400, damping: 26 }}
        type="button"
        whileHover={isIdle ? { scale: 1.05 } : undefined}
        whileTap={isIdle || status === 'connected' ? { scale: 0.95 } : undefined}
        onClick={onToggle}
      >
        <Power className={s.icon} />
        <span>{t(LABEL_KEYS[status])}</span>
      </motion.button>
    </div>
  );
};
