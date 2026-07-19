import { clsx } from 'clsx';

import { Label, Text } from '../../atoms';

import s from './FormField.module.scss';

import type { FormFieldProps } from './FormField.types';

export const FormField = ({ label, children, error, htmlFor, className }: FormFieldProps) => (
  <div className={clsx(s.root, className)}>
    <Label htmlFor={htmlFor}>{label}</Label>
    {children}
    {error && (
      <Text role="alert" size="xs" tone="danger">
        {error}
      </Text>
    )}
  </div>
);
