import type { ReactNode } from 'react';

export type SelectOption = {
  value: string;
  label: ReactNode;
  isDisabled?: boolean;
  title?: string;
};

export type SelectProps = {
  value: string;
  options: SelectOption[];
  id?: string;
  placeholder?: string;
  isDisabled?: boolean;
  className?: string;
  'aria-label'?: string;
  onChange: (value: string) => void;
};
