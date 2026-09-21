import type { AppSplashProps } from './AppSplash.types';

import { BrandMark } from '../../atoms/BrandMark';

import s from './AppSplash.module.scss';

export const AppSplash = ({ label }: AppSplashProps) => (
  <div className={s.root} role='status'>
    <div className={s.card}>
      <BrandMark className={s.mark} size='lg' />

      <span aria-hidden className={s.bar}>
        <span className={s.fill} />
      </span>

      {label && <span className={s.label}>{label}</span>}
    </div>
  </div>
);
