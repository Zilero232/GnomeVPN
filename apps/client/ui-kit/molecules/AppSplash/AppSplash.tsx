import { Spinner } from '../../atoms/Spinner';

import s from './AppSplash.module.scss';

export const AppSplash = () => (
  <div className={s.root} role='status'>
    <Spinner className={s.spinner} />
  </div>
);
