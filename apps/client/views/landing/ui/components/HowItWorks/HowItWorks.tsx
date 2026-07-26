'use client';

import { LOWEST_MONTHLY_RUB } from '@gnomevpn/schemas';
import { useTranslations } from 'next-intl';

import { Text } from '@/shared/ui';
import { HOW_IT_WORKS_STEPS } from '../../../config';

import s from './HowItWorks.module.scss';

export const HowItWorks = () => {
  const t = useTranslations('landing.how');

  return (
    <div className={s.grid}>
      {HOW_IT_WORKS_STEPS.map((step, index) => (
        <article className={s.step} key={step}>
          <Text as="span" className={s.index}>
            0{index + 1}
          </Text>
          <Text as="h3" className={s.title}>
            {t(`${step}Title`)}
          </Text>
          <Text as="p" className={s.body}>
            {t(`${step}Body`, { price: LOWEST_MONTHLY_RUB })}
          </Text>
        </article>
      ))}
    </div>
  );
};
