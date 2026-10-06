import { clsx } from 'clsx';
import { TriangleAlert } from 'lucide-react';

import type { ErrorBlockProps } from './ErrorBlock.types';

import { Text } from '../../atoms';
import { SubmitButton } from '../SubmitButton';

import s from './ErrorBlock.module.scss';

export const ErrorBlock = ({ message, retryLabel, isRetrying = false, className, onRetry }: ErrorBlockProps) => (
  <div className={clsx(s.root, className)} role='alert'>
    <span className={s.message}>
      <TriangleAlert aria-hidden className={s.icon} size={16} />

      <Text as='span' size='sm'>
        {message}
      </Text>
    </span>

    <SubmitButton isPending={isRetrying} size='md' type='button' variant='ghost' onClick={onRetry}>
      {retryLabel}
    </SubmitButton>
  </div>
);
