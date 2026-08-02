'use client';

import { Tabs as BaseTabs } from '@base-ui-components/react/tabs';
import { clsx } from 'clsx';

import type { TabsProps } from './Tabs.types';

import s from './Tabs.module.scss';

export const Tabs = ({ items, defaultValue, className, panelClassName }: TabsProps) => (
  <BaseTabs.Root className={clsx(s.root, className)} defaultValue={defaultValue ?? items[0]?.value}>
    <BaseTabs.List className={s.list}>
      {items.map((item) => (
        <BaseTabs.Tab key={item.value} className={s.tab} value={item.value}>
          {item.label}
        </BaseTabs.Tab>
      ))}

      <BaseTabs.Indicator className={s.indicator} />
    </BaseTabs.List>

    {items.map((item) => (
      <BaseTabs.Panel key={item.value} className={clsx(s.panel, !item.isBare && panelClassName)} value={item.value}>
        {item.content}
      </BaseTabs.Panel>
    ))}
  </BaseTabs.Root>
);
