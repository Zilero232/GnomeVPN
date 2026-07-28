import { WG } from '../../config';

import type { NextWireguardIpInput } from './allocate-ip.types';

const FIRST_HOST = WG.serverHostOffset + 1;
const LAST_HOST = 254;

export const nextWireguardIp = ({ subnet, taken }: NextWireguardIpInput): string | null => {
  const prefix = subnet.slice(0, subnet.lastIndexOf('.') + 1);
  const used = new Set(taken);

  for (let host = FIRST_HOST; host <= LAST_HOST; host += 1) {
    const candidate = `${prefix}${host}`;

    if (!used.has(candidate)) {
      return candidate;
    }
  }

  return null;
};
