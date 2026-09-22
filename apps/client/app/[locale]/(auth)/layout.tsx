import type { ReactNode } from 'react';

import { LocaleSwitcher } from '@/features/app/switch-locale';
import { BrandMark } from '@/ui-kit';

import s from './layout.module.scss';

const AuthLayout = ({ children }: { children: ReactNode }) => (
  <div className={s.root}>
    <header className={s.header}>
      <BrandMark />
      <LocaleSwitcher />
    </header>

    <main className={s.main}>
      <div className={s.panel}>{children}</div>
    </main>
  </div>
);

export default AuthLayout;
