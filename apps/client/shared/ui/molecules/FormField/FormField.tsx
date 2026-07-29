'use client';

import { Field } from '@base-ui-components/react/field';
import { clsx } from 'clsx';

import type { FormFieldProps } from './FormField.types';

import { Label, Text } from '../../atoms';

import s from './FormField.module.scss';

export const FormField = ({
  label,
  children,
  error,
  hint,
  htmlFor,
  hasFloatingError,
  className
}: FormFieldProps) => (
  <Field.Root
    className={clsx(s.root, hasFloatingError && s.floatingError, className)}
    invalid={Boolean(error)}
  >
    <Field.Label render={<Label htmlFor={htmlFor} />}>{label}</Field.Label>

    {children}

    {hint && !error && (
      <Field.Description className={s.hint} render={<Text size='xs' tone='muted' />}>
        {hint}
      </Field.Description>
    )}

    {error && (
      <Field.Error match className={s.error} render={<Text size='xs' tone='danger' />}>
        {error}
      </Field.Error>
    )}
  </Field.Root>
);
