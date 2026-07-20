import type { ReactNode } from 'react';

export type FormFieldProps = {
  label: ReactNode;
  children: ReactNode;
  error?: ReactNode;
  htmlFor: string;
  /** Keeps the row height fixed by taking the error message out of flow. */
  hasFloatingError?: boolean;
  className?: string;
};
