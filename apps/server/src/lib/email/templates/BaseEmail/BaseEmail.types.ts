import type { ReactNode } from 'react';

export type EmailAction = {
  url: string;
  label: string;
};

export type BaseEmailProps = {
  preview: string;
  heading: string;
  action?: EmailAction;
  children: ReactNode;
};
