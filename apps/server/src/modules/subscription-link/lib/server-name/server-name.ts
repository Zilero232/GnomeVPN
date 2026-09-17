import { isTruthy } from 'remeda';

import type { ServerNameInput } from './server-name.types';

import { COUNTRY_CODE, LATIN_A, REGIONAL_INDICATOR_A } from './server-name.constants';

const countryFlag = (countryCode: string): string => {
  const code = countryCode.trim().toUpperCase();

  if (!COUNTRY_CODE.test(code)) {
    return '';
  }

  return String.fromCodePoint(...[...code].map((letter) => REGIONAL_INDICATOR_A + letter.charCodeAt(0) - LATIN_A));
};

export const serverName = ({ country, countryCode, city, suffix }: ServerNameInput): string =>
  [countryFlag(countryCode), country, city, suffix].filter(isTruthy).join(' ');
