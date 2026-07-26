import s from './Banner.module.scss';

import type { BannerProps } from './Banner.types';

export const Banner = ({ tone, icon, title, description, action }: BannerProps) => (
  <div
    aria-live={tone === 'accent' ? 'polite' : 'assertive'}
    className={s.root}
    data-tone={tone}
    role={tone === 'accent' ? 'status' : 'alert'}
  >
    <div className={s.head}>
      <span aria-hidden className={s.badge}>
        {icon}
      </span>

      <span className={s.title}>{title}</span>
    </div>

    <p className={s.body}>{description}</p>

    {action && <div className={s.action}>{action}</div>}
  </div>
);
