import { clsx } from 'clsx';

import { SITE } from '@/shared/config';

import s from './BrandMark.module.scss';

import type { BrandMarkProps } from './BrandMark.types';

const LOGO_SIZE = { sm: 18, md: 22, lg: 28 } as const;

export const BrandMark = ({
  size = 'md',
  tone = 'default',
  labelClassName,
  className,
}: BrandMarkProps) => (
  <span className={clsx(s.root, s[size], tone === 'muted' && s.muted, className)}>
    {/** biome-ignore lint/performance/noImgElement: an inline SVG needs no next/image pipeline, and the app is a static export */}
    <img
      alt=""
      className={s.logo}
      height={LOGO_SIZE[size]}
      src="/brand/favicon.svg"
      width={LOGO_SIZE[size]}
    />
    <span className={labelClassName}>{SITE.name}</span>
  </span>
);
