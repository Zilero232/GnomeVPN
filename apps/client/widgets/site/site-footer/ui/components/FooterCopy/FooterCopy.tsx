'use client';

import { useTranslations } from 'next-intl';
import { useSyncExternalStore } from 'react';

import { SITE } from '@/shared/config';

import type { FooterCopyProps } from './FooterCopy.types';

import { BUILD_YEAR } from './FooterCopy.constants';

const subscribe = () => () => {};

export const FooterCopy = ({ className }: FooterCopyProps) => {
  const t = useTranslations('footer');

  const year = useSyncExternalStore(
    subscribe,
    () => new Date().getFullYear(),
    () => BUILD_YEAR
  );

  return <span className={className}>{t('copy', { name: SITE.name, year })}</span>;
};
