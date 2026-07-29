import type { ReactNode } from 'react';

export type BannerTone = 'accent' | 'danger' | 'warning';

export type BannerProps = {
  tone: BannerTone;
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
};
