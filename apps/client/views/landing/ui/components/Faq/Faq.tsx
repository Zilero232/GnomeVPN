'use client';

import { useTranslations } from 'next-intl';

import { Text } from '@/shared/ui';
import { FAQ_ITEMS } from '../../../config';

import s from './Faq.module.scss';

export const Faq = () => {
  const t = useTranslations('landing.faq');

  return (
    <div className={s.list}>
      {FAQ_ITEMS.map((item) => (
        <article className={s.item} key={item}>
          <Text as="h3" className={s.question}>
            {t(`q${item}`)}
          </Text>
          <Text as="p" className={s.answer}>
            {t(`a${item}`)}
          </Text>
        </article>
      ))}
    </div>
  );
};
