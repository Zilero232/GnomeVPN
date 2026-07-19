import type { ReactNode } from 'react';

export type StatusScreenProps = {
  code: string;
  title: string;
  body: string;
  children?: ReactNode;
  tone?: 'accent' | 'danger';
};
