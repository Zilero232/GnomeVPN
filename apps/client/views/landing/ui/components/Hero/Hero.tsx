'use client';

import { LOWEST_MONTHLY_RUB } from '@gnomevpn/schemas';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

import { ROUTES } from '@/shared/constants';
import { Button, Text } from '@/shared/ui';

import { HERO_METRICS } from '../../../config';

import s from './Hero.module.scss';

export const Hero = () => {
  const t = useTranslations('landing');

  return (
    <section className={s.root}>
      {/** an inline SVG needs no next/image pipeline, and the app is a static export */}
      <img aria-hidden alt='' className={s.mark} height={200} src='/brand/logo-mark.svg' width={200} />

      <Text as='span' className={s.eyebrow}>
        {t('eyebrow')}
      </Text>

      <Text as='h1' className={s.title}>
        {t('titleLine1')} <br />
        {t('titleLine2')} <span className={s.titleAccent}>{t('titleAccent')}</span>
      </Text>

      <Text as='p' className={s.lead}>
        {t('lead')}
      </Text>

      <div className={s.actions}>
        <Link href={ROUTES.account}>
          <Button size='md'>{t('cta', { price: LOWEST_MONTHLY_RUB })}</Button>
        </Link>
        <Link href='#how'>
          <Button size='md' variant='ghost'>
            {t('ctaSecondary')}
          </Button>
        </Link>
      </div>

      <div className={s.meta}>
        {HERO_METRICS.map((metric) => (
          <div key={metric.key} className={s.metaItem}>
            <span className={s.metaValue}>{metric.value}</span>
            <span className={s.metaLabel}>{t(`metrics.${metric.key}`)}</span>
          </div>
        ))}
      </div>
    </section>
  );
};
