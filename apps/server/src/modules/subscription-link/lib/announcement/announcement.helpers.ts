import { differenceInCalendarDays, differenceInMinutes } from 'date-fns';
import { isNullish, unique } from 'remeda';

import type { AnnouncementNode, NodeMomentInput } from './announcement.types';

import { ANNOUNCE_LOCALE, DAY_FORMS, FRESH_NODE_DAYS, NODE_STALE_MINUTES } from './announcement.constants';

const plural = new Intl.PluralRules(ANNOUNCE_LOCALE);

const listFormat = new Intl.ListFormat(ANNOUNCE_LOCALE, { style: 'long', type: 'conjunction' });

export const daysLeftLabel = (days: number): string => `${days} ${DAY_FORMS[plural.select(days)]}`;

export const isStale = ({ node, now }: NodeMomentInput): boolean => {
  if (isNullish(node.lastHealthyAt)) {
    return true;
  }

  return differenceInMinutes(now, node.lastHealthyAt) >= NODE_STALE_MINUTES;
};

export const isFresh = ({ node, now }: NodeMomentInput): boolean => differenceInCalendarDays(now, node.createdAt) <= FRESH_NODE_DAYS;

export const countryList = (nodes: AnnouncementNode[]): string => listFormat.format(unique(nodes.map((node) => node.country)));
