import { isNonNullish } from 'remeda';

import type { IncyHeaders, IncyHeadersInput } from './incy-headers.types';

import { headerValue } from './header-value';
import { PROFILE_TITLE, SORT_ORDER, UPDATE_INTERVAL_HOURS } from './incy-headers.constants';
import { userinfo } from './userinfo';

export const incyHeaders = ({ currentPeriodEnd, clientUrl, supportUrl, announce }: IncyHeadersInput): IncyHeaders => {
  const headers: IncyHeaders = {
    'profile-title': headerValue(PROFILE_TITLE),
    'profile-update-interval': String(UPDATE_INTERVAL_HOURS),
    'subscription-userinfo': userinfo(currentPeriodEnd),
    'profile-web-page-url': clientUrl,
    'sort-order': SORT_ORDER
  };

  if (isNonNullish(supportUrl)) {
    headers['support-url'] = supportUrl;
  }

  if (isNonNullish(announce)) {
    headers.announce = headerValue(announce);
  }

  return headers;
};
