import { isPlainObject, isString } from 'remeda';

import type { ClaimedEmailInput } from './auth.types';

import { EMAIL_FIELD_BY_PATH } from './auth.constants';

export const claimedEmail = ({ path, body }: ClaimedEmailInput): string | null => {
  const field = Object.hasOwn(EMAIL_FIELD_BY_PATH, path) ? EMAIL_FIELD_BY_PATH[path] : null;

  if (!field || !isPlainObject(body)) {
    return null;
  }

  const value = body[field];

  return isString(value) ? value : null;
};
