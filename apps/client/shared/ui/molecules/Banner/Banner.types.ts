import type { ReactNode } from 'react';

export type BannerTone = 'accent' | 'warning' | 'danger';

export type BannerProps = {
  tone: BannerTone;
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
};
