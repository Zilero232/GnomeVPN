import type { ReactNode } from 'react';

export type AccordionItem = {
  value: string;
  title: string;
  content: ReactNode;
};

export type AccordionProps = {
  items: AccordionItem[];
  className?: string;
};
