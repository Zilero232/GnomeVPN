import { randomInt } from 'node:crypto';

import { LINK_CODE_ALPHABET, LINK_CODE_LENGTH } from '../../config';

export const generateLinkCode = (): string =>
  Array.from({ length: LINK_CODE_LENGTH }, () => LINK_CODE_ALPHABET[randomInt(LINK_CODE_ALPHABET.length)]).join('');

export const normaliseLinkCode = (raw: string): string => raw.trim().toUpperCase().replaceAll(/\s+/gu, '');
