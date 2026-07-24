'use client';

import { useTranslations } from 'next-intl';

import { PLATFORMS } from '../../../config';

import s from './Platforms.module.scss';

export const Platforms = () => {
  const t = useTranslations('landing.platforms');

  return (
    <div className={s.grid}>
      {PLATFORMS.map((platform) => (
        <article className={s.card} data-native={platform.isNative} key={platform.key}>
          <span className={s.badge}>{t(platform.isNative ? 'native' : 'config')}</span>
          <h3 className={s.name}>{platform.name}</h3>
          <p className={s.body}>{t(`${platform.key}Body`)}</p>
        </article>
      ))}
    </div>
  );
};
