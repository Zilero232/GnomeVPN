import { isNonNullish } from 'remeda';

import type { IncyHeaders, IncyHeadersInput } from './incy-headers.types';

import { headerValue } from './header-value';
import { HIDE_URL, PROFILE_TITLE, SORT_ORDER, UPDATE_INTERVAL_HOURS } from './incy-headers.constants';
import { userinfo } from './userinfo';

export const incyHeaders = ({ currentPeriodEnd, traffic, clientUrl, supportUrl, announce }: IncyHeadersInput): IncyHeaders => {
  const headers: IncyHeaders = {
    'profile-title': headerValue(PROFILE_TITLE),
    'profile-update-interval': String(UPDATE_INTERVAL_HOURS),
    'subscription-userinfo': userinfo({ currentPeriodEnd, traffic }),
    'profile-web-page-url': clientUrl,
    'sort-order': SORT_ORDER,
    'hide-url': HIDE_URL
  };

  if (isNonNullish(supportUrl)) {
    headers['support-url'] = supportUrl;
  }

  if (isNonNullish(announce)) {
    headers.announce = headerValue(announce);
  }

  return headers;
};
