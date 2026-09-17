'use client';

import { useTranslations } from 'next-intl';

import { INCY_PLATFORMS } from '@/entities/app/incy';
import { LinkCard } from '@/ui-kit';

import s from './IncyPlatforms.module.scss';

export const IncyPlatforms = () => {
  const t = useTranslations('incy');

  return (
    <div className={s.root}>
      {INCY_PLATFORMS.map(({ id, icon, href }) => (
        <LinkCard key={id} href={href} icon={icon} label={t(`platforms.${id}`)} size='sm' />
      ))}
    </div>
  );
};
