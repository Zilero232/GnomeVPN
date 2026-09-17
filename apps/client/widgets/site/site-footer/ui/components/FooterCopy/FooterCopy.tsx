'use client';

import { useTranslations } from 'next-intl';
import { useSyncExternalStore } from 'react';

import { SITE } from '@/shared/config';

import type { FooterCopyProps } from './FooterCopy.types';

const subscribe = () => () => {};

export const FooterCopy = ({ className, buildYear }: FooterCopyProps) => {
  const t = useTranslations('footer');

  const year = useSyncExternalStore(
    subscribe,
    () => new Date().getFullYear(),
    () => buildYear
  );

  return <span className={className}>{t('copy', { name: SITE.name, year })}</span>;
};
