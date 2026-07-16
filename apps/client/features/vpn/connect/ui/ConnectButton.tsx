'use client';

import { clsx } from 'clsx';
import { Power } from 'lucide-react';

import s from './ConnectButton.module.scss';

import type { VpnConnectionStatus } from '../model/hooks/use-vpn-connection';
import type { ConnectButtonProps } from './ConnectButton.types';

const LABELS: Record<VpnConnectionStatus, string> = {
  disconnected: 'Подключиться',
  connecting: 'Подключаем…',
  connected: 'Отключиться',
};

export const ConnectButton = ({ status, disabled, onToggle }: ConnectButtonProps) => (
  <button
    className={clsx(s.root, s[status])}
    disabled={disabled || status === 'connecting'}
    type="button"
    onClick={onToggle}
  >
    <Power className={s.icon} />
    <span>{LABELS[status]}</span>
  </button>
);
