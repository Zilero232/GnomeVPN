import { wantsJson } from '@gnomevpn/logger';

import type { ColorForInput, PaintInput } from './reporter.types';

import { RESET_COLOR, SCOPE_COLORS } from './reporter.constants';

export const colorFor = ({ key, taken }: ColorForInput): string | undefined => {
  if (wantsJson()) {
    return undefined;
  }

  return taken.get(key) ?? SCOPE_COLORS[taken.size % SCOPE_COLORS.length];
};

export const paint = ({ message, color }: PaintInput): string => (color ? `${color}${message}${RESET_COLOR}` : message);
