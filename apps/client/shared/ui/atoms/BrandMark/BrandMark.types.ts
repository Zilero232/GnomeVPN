export type BrandMarkProps = {
  size?: 'sm' | 'md' | 'lg';
  tone?: 'default' | 'muted';
  /** Class applied to the wordmark, so callers can hide it on narrow screens. */
  labelClassName?: string;
  className?: string;
};
