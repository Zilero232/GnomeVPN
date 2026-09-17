import type { ReactNode } from 'react';

import { SiteFooter } from '@/widgets/site/site-footer';
import { SiteHeader } from '@/widgets/site/site-header';

import s from './layout.module.scss';

const MarketingLayout = ({ children }: { children: ReactNode }) => (
  <div className={s.root}>
    <SiteHeader />

    <div className={s.content}>{children}</div>

    <SiteFooter />
  </div>
);

export default MarketingLayout;
