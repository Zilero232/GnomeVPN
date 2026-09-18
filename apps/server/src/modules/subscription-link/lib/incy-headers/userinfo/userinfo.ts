import { getUnixTime } from 'date-fns';

import type { UserinfoInput } from './userinfo.types';

import { NO_TRAFFIC_LIMIT, USERINFO_HIDDEN } from './userinfo.constants';

export const userinfo = ({ currentPeriodEnd, traffic }: UserinfoInput): string => {
  if (!currentPeriodEnd) {
    return USERINFO_HIDDEN;
  }

  const counters = [`upload=${traffic.up}`, `download=${traffic.down}`, `total=${NO_TRAFFIC_LIMIT}`, `expire=${getUnixTime(currentPeriodEnd)}`];

  return counters.join(';');
};
