'use client';

import { Accordion as BaseAccordion } from '@base-ui/react/accordion';
import { clsx } from 'clsx';
import { ChevronDown } from 'lucide-react';

import type { AccordionProps } from './Accordion.types';

import s from './Accordion.module.scss';

export const Accordion = ({ items, className }: AccordionProps) => (
  <BaseAccordion.Root className={clsx(s.root, className)}>
    {items.map(({ value, title, content }) => (
      <BaseAccordion.Item key={value} className={s.item} value={value}>
        <BaseAccordion.Header className={s.header}>
          <BaseAccordion.Trigger className={s.trigger}>
            <span className={s.title}>{title}</span>
            <ChevronDown aria-hidden className={s.chevron} size={18} />
          </BaseAccordion.Trigger>
        </BaseAccordion.Header>

        <BaseAccordion.Panel keepMounted className={s.panel}>
          <div className={s.content}>{content}</div>
        </BaseAccordion.Panel>
      </BaseAccordion.Item>
    ))}
  </BaseAccordion.Root>
);
