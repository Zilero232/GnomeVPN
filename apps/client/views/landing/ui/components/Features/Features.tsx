'use client';

import { useTranslations } from 'next-intl';

import { FEATURE_CARDS } from '../../../config';
import { FEATURE_ICONS } from './Features.config';

import s from './Features.module.scss';

export const Features = () => {
  const t = useTranslations('landing.features');

  return (
    <div className={s.grid}>
      {FEATURE_CARDS.map((card) => {
        const Icon = FEATURE_ICONS[card];

        return (
          <article className={s.card} key={card}>
            <span className={s.icon}>
              <Icon size={17} strokeWidth={1.8} />
            </span>

            <h3 className={s.title}>{t(`${card}Title`)}</h3>
            <p className={s.body}>{t(`${card}Body`)}</p>
          </article>
        );
      })}
    </div>
  );
};
