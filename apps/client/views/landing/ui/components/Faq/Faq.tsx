'use client';

import { useTranslations } from 'next-intl';

import s from './Faq.module.scss';

const ITEMS = ['1', '2', '3', '4'] as const;

export const Faq = () => {
  const t = useTranslations('landing.faq');

  return (
    <div className={s.list}>
      {ITEMS.map((item) => (
        <article className={s.item} key={item}>
          <h3 className={s.question}>{t(`q${item}`)}</h3>
          <p className={s.answer}>{t(`a${item}`)}</p>
        </article>
      ))}
    </div>
  );
};
