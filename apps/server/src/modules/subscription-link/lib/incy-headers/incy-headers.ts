import { isNonNullish } from 'remeda';

import type { IncyHeaders, IncyHeadersInput } from './incy-headers.types';

import { SUBSCRIPTION_PROFILE_TITLE, SUBSCRIPTION_SORT_ORDER, SUBSCRIPTION_UPDATE_INTERVAL_HOURS, SUBSCRIPTION_USERINFO_HIDDEN } from '../../config';

const MILLISECONDS_PER_SECOND = 1000;

const isAscii = (value: string) => /^[\x20-\x7E]*$/.test(value);

export const incyHeaderValue = (value: string): string => (isAscii(value) ? value : `base64:${Buffer.from(value, 'utf8').toString('base64')}`);

export const incyUserinfo = (currentPeriodEnd: Date | null): string => {
  if (!currentPeriodEnd) {
    return SUBSCRIPTION_USERINFO_HIDDEN;
  }

  const expire = Math.floor(currentPeriodEnd.getTime() / MILLISECONDS_PER_SECOND);

  return `upload=0;download=0;total=0;expire=${expire}`;
};

export const incyHeaders = ({ currentPeriodEnd, clientUrl, supportUrl, announce }: IncyHeadersInput): IncyHeaders => {
  const headers: IncyHeaders = {
    'profile-title': incyHeaderValue(SUBSCRIPTION_PROFILE_TITLE),
    'profile-update-interval': String(SUBSCRIPTION_UPDATE_INTERVAL_HOURS),
    'subscription-userinfo': incyUserinfo(currentPeriodEnd),
    'profile-web-page-url': clientUrl,
    'sort-order': SUBSCRIPTION_SORT_ORDER
  };

  if (isNonNullish(supportUrl)) {
    headers['support-url'] = supportUrl;
  }

  if (isNonNullish(announce)) {
    headers.announce = incyHeaderValue(announce);
  }

  return headers;
};
