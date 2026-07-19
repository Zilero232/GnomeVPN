'use client';

import { useTranslations } from 'next-intl';

import s from './HowItWorks.module.scss';

const STEPS = ['step1', 'step2', 'step3'] as const;

export const HowItWorks = () => {
  const t = useTranslations('landing.how');

  return (
    <div className={s.grid}>
      {STEPS.map((step, index) => (
        <article className={s.step} key={step}>
          <span className={s.index}>0{index + 1}</span>
          <h3 className={s.title}>{t(`${step}Title`)}</h3>
          <p className={s.body}>{t(`${step}Body`)}</p>
        </article>
      ))}
    </div>
  );
};
