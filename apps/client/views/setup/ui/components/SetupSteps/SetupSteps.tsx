import { Text } from '@/ui-kit';

import type { SetupStepsProps } from './SetupSteps.types';

import s from './SetupSteps.module.scss';

export const SetupSteps = ({ steps }: SetupStepsProps) => (
  <ol className={s.root}>
    {steps.map(({ key, title, body }, index) => (
      <li key={key} className={s.step}>
        <span aria-hidden className={s.index}>
          {index + 1}
        </span>

        <div className={s.body}>
          <Text as='h3' className={s.stepTitle}>
            {title}
          </Text>

          <Text as='p' size='sm' tone='muted'>
            {body}
          </Text>
        </div>
      </li>
    ))}
  </ol>
);
