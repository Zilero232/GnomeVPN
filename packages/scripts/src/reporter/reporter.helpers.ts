import { wantsJson } from '@gnomevpn/logger';

import type { ColorForInput, PaintInput } from './reporter.types';

import { SCOPE_COLOR } from './reporter.constants';

export const colorFor = ({ key, taken }: ColorForInput): string | undefined => {
  if (wantsJson()) {
    return undefined;
  }

  return taken.get(key) ?? SCOPE_COLOR.palette[taken.size % SCOPE_COLOR.palette.length];
};

export const paint = ({ message, color }: PaintInput): string => (color ? `${color}${message}${SCOPE_COLOR.reset}` : message);
