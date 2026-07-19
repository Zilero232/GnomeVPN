'use client';

import { clsx } from 'clsx';
import { useTranslations } from 'next-intl';
import prettyBytes from 'pretty-bytes';

import s from './PlatformCard.module.scss';

import type { PlatformCardProps } from './PlatformCard.types';

export const PlatformCard = ({ label, Icon, asset }: PlatformCardProps) => {
  const t = useTranslations('downloadApp');

  if (!asset) {
    return (
      <div className={clsx(s.root, s.unavailable)}>
        <Icon className={s.icon} size={22} />
        <span className={s.name}>{label}</span>
        <span className={s.hint}>{t('notAvailable')}</span>
      </div>
    );
  }

  return (
    <a
      download
      className={clsx(s.root, s.available)}
      href={asset.downloadUrl}
      rel="noopener noreferrer"
      target="_blank"
    >
      <Icon className={s.icon} size={22} />
      <span className={s.name}>{label}</span>
      <span className={s.hint}>{prettyBytes(asset.sizeBytes)}</span>
    </a>
  );
};
