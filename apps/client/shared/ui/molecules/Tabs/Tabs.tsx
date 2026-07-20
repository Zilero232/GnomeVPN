'use client';

import { Tabs as BaseTabs } from '@base-ui-components/react/tabs';
import { clsx } from 'clsx';

import s from './Tabs.module.scss';

import type { TabsProps } from './Tabs.types';

export const Tabs = ({ items, defaultValue, className, panelClassName }: TabsProps) => (
  <BaseTabs.Root className={clsx(s.root, className)} defaultValue={defaultValue ?? items[0]?.value}>
    <BaseTabs.List className={s.list}>
      {items.map((item) => (
        <BaseTabs.Tab className={s.tab} key={item.value} value={item.value}>
          {item.label}
        </BaseTabs.Tab>
      ))}

      <BaseTabs.Indicator className={s.indicator} />
    </BaseTabs.List>

    {items.map((item) => (
      <BaseTabs.Panel className={clsx(s.panel, panelClassName)} key={item.value} value={item.value}>
        {item.content}
      </BaseTabs.Panel>
    ))}
  </BaseTabs.Root>
);
