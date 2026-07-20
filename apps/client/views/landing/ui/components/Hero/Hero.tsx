'use client';

import { LOWEST_MONTHLY_RUB } from '@gnomevpn/schemas';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { ROUTES } from '@/shared/constants';
import { Button } from '@/shared/ui';
import { HERO_METRICS } from '../../../config';

import s from './Hero.module.scss';

export const Hero = () => {
  const t = useTranslations('landing');

  return (
    <section className={s.root}>
      {/** biome-ignore lint/performance/noImgElement: an inline SVG needs no next/image pipeline, and the app is a static export */}
      <img
        alt=""
        aria-hidden
        className={s.mark}
        height={200}
        src="/brand/logo-mark.svg"
        width={200}
      />

      <span className={s.eyebrow}>{t('eyebrow')}</span>

      <h1 className={s.title}>
        {t('titleLine1')} <br />
        {t('titleLine2')} <span className={s.titleAccent}>{t('titleAccent')}</span>
      </h1>

      <p className={s.lead}>{t('lead')}</p>

      <div className={s.actions}>
        <Link href={ROUTES.account}>
          <Button size="md">{t('cta', { price: LOWEST_MONTHLY_RUB })}</Button>
        </Link>
        <Link href="#how">
          <Button size="md" variant="ghost">
            {t('ctaSecondary')}
          </Button>
        </Link>
      </div>

      <div className={s.meta}>
        {HERO_METRICS.map((metric) => (
          <div className={s.metaItem} key={metric.key}>
            <span className={s.metaValue}>{metric.value}</span>
            <span className={s.metaLabel}>{t(`metrics.${metric.key}`)}</span>
          </div>
        ))}
      </div>
    </section>
  );
};
