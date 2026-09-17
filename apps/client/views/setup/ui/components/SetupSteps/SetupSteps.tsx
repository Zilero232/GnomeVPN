'use client';

import { useTranslations } from 'next-intl';

import { Text } from '@/ui-kit';

import type { SetupStepsProps } from './SetupSteps.types';

import s from './SetupSteps.module.scss';

export const SetupSteps = ({ platform, steps }: SetupStepsProps) => {
  const t = useTranslations('setup');

  return (
    <ol className={s.root}>
      {steps.map((step, index) => (
        <li key={step} className={s.step}>
          <span aria-hidden className={s.index}>
            {index + 1}
          </span>

          <div className={s.body}>
            <Text as='h3' className={s.stepTitle}>
              {t(`steps.${step}.title`)}
            </Text>

            <Text as='p' size='sm' tone='muted'>
              {t(`platforms.${platform}.${step}`)}
            </Text>
          </div>
        </li>
      ))}
    </ol>
  );
};
