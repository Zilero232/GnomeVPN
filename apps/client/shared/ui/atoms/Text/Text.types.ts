import type { ComponentPropsWithoutRef, ReactNode } from 'react';

export type TextElement = 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'label' | 'p' | 'span';

export type TextSize = 'lg' | 'md' | 'sm' | 'xl' | 'xs';

export type TextWeight = 'bold' | 'medium' | 'regular' | 'semibold';

export type TextTone = 'accent' | 'danger' | 'default' | 'muted' | 'success';

export type TextAlign = 'center' | 'left' | 'right';

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
} & Omit<ComponentPropsWithoutRef<As>, 'children' | 'className' | 'color'>;
