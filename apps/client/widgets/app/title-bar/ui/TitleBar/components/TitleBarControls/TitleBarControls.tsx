'use client';

import { clsx } from 'clsx';
import { Minus, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import s from './TitleBarControls.module.scss';

import type { TitleBarControlsProps } from './TitleBarControls.types';

export const TitleBarControls = ({ onMinimize, onClose }: TitleBarControlsProps) => {
  const t = useTranslations('window');

  return (
    <div className={s.root}>
      <button aria-label={t('minimize')} className={s.button} type="button" onClick={onMinimize}>
        <Minus className={s.icon} />
      </button>

      <button
        aria-label={t('close')}
        className={clsx(s.button, s.closeButton)}
        type="button"
        onClick={onClose}
      >
        <X className={s.icon} />
      </button>
    </div>
  );
};
