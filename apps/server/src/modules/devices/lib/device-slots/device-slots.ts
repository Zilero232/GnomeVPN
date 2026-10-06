import { sortBy } from 'remeda';

import type { SlotHoldersInput } from './device-slots.types';

export const slotHolders = ({ devices, limit }: SlotHoldersInput): Set<string> => {
  const ordered = sortBy(devices, [(device) => device.createdAt.getTime(), 'asc'], [(device) => device.id, 'asc']);

  return new Set(ordered.slice(0, Math.max(limit, 0)).map((device) => device.id));
};
