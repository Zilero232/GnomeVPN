import { differenceInCalendarDays, isAfter } from 'date-fns';
import { isEmpty, isNullish } from 'remeda';

import type { AnnouncementInput } from './announcement.types';

import { ANNOUNCEMENTS, EXPIRY_WARNING_DAYS } from './announcement.constants';
import { countryList, daysLeftLabel, isFresh, isStale } from './announcement.helpers';

export const announcement = ({ currentPeriodEnd, hasSubscription, nodes, now = new Date() }: AnnouncementInput): string | null => {
  if (!hasSubscription || isNullish(currentPeriodEnd)) {
    return ANNOUNCEMENTS.noSubscription;
  }

  if (!isAfter(currentPeriodEnd, now)) {
    return ANNOUNCEMENTS.expired;
  }

  const daysLeft = differenceInCalendarDays(currentPeriodEnd, now);

  if (daysLeft <= 0) {
    return ANNOUNCEMENTS.expiringToday;
  }

  if (daysLeft <= EXPIRY_WARNING_DAYS) {
    return ANNOUNCEMENTS.expiringInDays(daysLeftLabel(daysLeft));
  }

  const down = nodes.filter((node) => isStale({ node, now }));

  if (!isEmpty(down)) {
    return ANNOUNCEMENTS.nodesDown(countryList(down));
  }

  const fresh = nodes.filter((node) => isFresh({ node, now }));

  if (!isEmpty(fresh)) {
    return ANNOUNCEMENTS.freshNodes(countryList(fresh));
  }

  return null;
};
