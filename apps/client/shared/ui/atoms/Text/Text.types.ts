import type { ComponentPropsWithoutRef, ReactNode } from 'react';

export type TextElement = 'p' | 'span' | 'div' | 'label' | 'h1' | 'h2' | 'h3' | 'h4';

export type TextSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type TextWeight = 'regular' | 'medium' | 'semibold' | 'bold';

export type TextTone = 'default' | 'muted' | 'accent' | 'danger' | 'success';

export type TextAlign = 'left' | 'center' | 'right';

export type TextProps<As extends TextElement = 'p'> = {
  as?: As;
  size?: TextSize;
  weight?: TextWeight;
  tone?: TextTone;
  align?: TextAlign;
  mono?: boolean;
  uppercase?: boolean;
  truncate?: boolean;
  className?: string;
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<As>, 'className' | 'color' | 'children'>;
