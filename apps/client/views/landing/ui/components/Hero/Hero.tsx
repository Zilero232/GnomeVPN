'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { ROUTES } from '@/shared/constants';
import { Button } from '@/shared/ui';

import s from './Hero.module.scss';

const METRICS = [
  { value: 'WireGuard', key: 'protocol' },
  { value: '100 ₽', key: 'price' },
  { value: 'ChaCha20', key: 'cipher' },
] as const;

export const Hero = () => {
  const t = useTranslations('landing');

  return (
    <section className={s.root}>
      <span className={s.eyebrow}>{t('eyebrow')}</span>

      <h1 className={s.title}>
        {t('titleLine1')} <br />
        {t('titleLine2')} <span className={s.titleAccent}>{t('titleAccent')}</span>
      </h1>

      <p className={s.lead}>{t('lead')}</p>

      <div className={s.actions}>
        <Link href={ROUTES.account}>
          <Button size="md">{t('cta')}</Button>
        </Link>
        <Link href="#how">
          <Button size="md" variant="ghost">
            {t('ctaSecondary')}
          </Button>
        </Link>
      </div>

      <div className={s.meta}>
        {METRICS.map((metric) => (
          <div className={s.metaItem} key={metric.key}>
            <span className={s.metaValue}>{metric.value}</span>
            <span className={s.metaLabel}>{t(`metrics.${metric.key}`)}</span>
          </div>
        ))}
      </div>
    </section>
  );
};
