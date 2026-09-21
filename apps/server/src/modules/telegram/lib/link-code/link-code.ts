import { randomInt } from 'node:crypto';

import { LINK_CODE } from '../../config';

export const generateLinkCode = (): string =>
  Array.from({ length: LINK_CODE.length }, () => LINK_CODE.alphabet[randomInt(LINK_CODE.alphabet.length)]).join('');

export const normaliseLinkCode = (raw: string): string => raw.trim().toUpperCase().replaceAll(/\s+/gu, '');
