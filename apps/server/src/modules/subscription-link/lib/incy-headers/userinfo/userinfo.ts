import { getUnixTime } from 'date-fns';

import { NO_TRAFFIC_LIMIT, USERINFO_HIDDEN } from './userinfo.constants';

export const userinfo = (currentPeriodEnd: Date | null): string => {
  if (!currentPeriodEnd) {
    return USERINFO_HIDDEN;
  }

  const counters = [
    `upload=${NO_TRAFFIC_LIMIT}`,
    `download=${NO_TRAFFIC_LIMIT}`,
    `total=${NO_TRAFFIC_LIMIT}`,
    `expire=${getUnixTime(currentPeriodEnd)}`
  ];

  return counters.join(';');
};
