import { LOWEST_MONTHLY_RUB } from '@gnomevpn/schemas';
import { useTranslations } from 'next-intl';

import { Text } from '@/ui-kit';

import { HOW_IT_WORKS_STEPS } from '../../../config';

import s from './HowItWorks.module.scss';

export const HowItWorks = () => {
  const t = useTranslations('landing.how');

  return (
    <ol className={s.grid}>
      {HOW_IT_WORKS_STEPS.map((step, index) => (
        <li key={step} className={s.step}>
          <span aria-hidden className={s.index}>
            {String(index + 1).padStart(2, '0')}
          </span>
          <Text as='h3' className={s.title}>
            {t(`${step}Title`)}
          </Text>
          <Text as='p' className={s.body}>
            {t(`${step}Body`, { price: LOWEST_MONTHLY_RUB })}
          </Text>
        </li>
      ))}
    </ol>
  );
};
