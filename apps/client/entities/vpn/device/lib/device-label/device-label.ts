import { isNonNullish } from 'remeda';

import type { DeviceLabelInput } from './device-label.types';

export const deviceName = ({ model, app }: DeviceLabelInput): string | null => model ?? app;

export const deviceDetails = ({ model, platform, osVersion, app }: DeviceLabelInput): string[] => {
  const system = [platform, osVersion].filter(isNonNullish).join(' ');
  const shownApp = isNonNullish(model) ? app : null;

  return [system, shownApp].filter((detail): detail is string => isNonNullish(detail) && detail.length > 0);
};
