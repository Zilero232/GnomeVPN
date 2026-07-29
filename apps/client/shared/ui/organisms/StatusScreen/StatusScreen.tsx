import { clsx } from 'clsx';

import type { StatusScreenProps } from './StatusScreen.types';

import s from './StatusScreen.module.scss';

export const StatusScreen = ({
  code,
  title,
  body,
  children,
  tone = 'accent'
}: StatusScreenProps) => (
  <main className={s.root}>
    <div className={clsx(s.code, tone === 'danger' ? s.codeDanger : s.codeAccent)}>
      {code}
      <span className={s.scan} />
    </div>

    <h1 className={s.title}>{title}</h1>
    <p className={s.body}>{body}</p>

    {children && <div className={s.actions}>{children}</div>}
  </main>
);
