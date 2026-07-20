'use client';

import { Field } from '@base-ui-components/react/field';
import { clsx } from 'clsx';

import { Label, Text } from '../../atoms';

import s from './FormField.module.scss';

import type { FormFieldProps } from './FormField.types';

export const FormField = ({
  label,
  children,
  error,
  htmlFor,
  hasFloatingError,
  className,
}: FormFieldProps) => (
  <Field.Root
    className={clsx(s.root, hasFloatingError && s.floatingError, className)}
    invalid={Boolean(error)}
  >
    <Field.Label render={<Label htmlFor={htmlFor} />}>{label}</Field.Label>

    {children}

    {error && (
      <Field.Error className={s.error} match render={<Text size="xs" tone="danger" />}>
        {error}
      </Field.Error>
    )}
  </Field.Root>
);
