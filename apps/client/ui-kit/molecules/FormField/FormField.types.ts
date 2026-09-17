import type { ReactNode } from 'react';

export type FormFieldProps = {
  label: ReactNode;
  children: ReactNode;
  error?: ReactNode;
  hint?: ReactNode;
  htmlFor: string;
  hasFloatingError?: boolean;
  className?: string;
};
