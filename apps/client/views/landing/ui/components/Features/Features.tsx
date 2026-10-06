import { useTranslations } from 'next-intl';

import { Text } from '@/ui-kit';

import { FEATURE_CARDS } from '../../../config';

import s from './Features.module.scss';

export const Features = () => {
  const t = useTranslations('landing.features');

  return (
    <div className={s.grid}>
      {FEATURE_CARDS.map((card) => (
        <article key={card} className={s.card}>
          <Text as='h3' className={s.title}>
            {t(`${card}Title`)}
          </Text>
          <Text as='p' className={s.body}>
            {t(`${card}Body`)}
          </Text>
        </article>
      ))}
    </div>
  );
};
