import { createHash, createHmac } from 'node:crypto';
import { entries, isNullish } from 'remeda';

import type { TelegramIdentity } from '../../telegram.types';
import type { IsFreshInput, VerifyWidgetInput, WidgetPayload } from './widget-auth.types';

import { timingSafeEqual } from '../../../../common/lib';
import { WIDGET_AUTH } from './widget-auth.constants';

const TELEGRAM_ID = /^\d{1,19}$/u;

const checkString = (payload: WidgetPayload) =>
  entries(payload)
    .filter(([key]) => key !== WIDGET_AUTH.hashField)
    .map(([key, value]) => `${key}=${value}`)
    .sort()
    .join(WIDGET_AUTH.separator);

const isFresh = ({ authDate, now }: IsFreshInput) => {
  const issuedAt = Number(authDate);

  if (!Number.isFinite(issuedAt)) {
    return false;
  }

  const age = now.getTime() / 1000 - issuedAt;

  return age >= 0 && age <= WIDGET_AUTH.maxAgeSeconds;
};

export const verifyWidgetPayload = ({ payload, botToken, now = new Date() }: VerifyWidgetInput) => {
  const { hash, auth_date: authDate } = payload;

  if (isNullish(hash) || isNullish(authDate) || !isFresh({ authDate, now })) {
    return false;
  }

  const secret = createHash('sha256').update(botToken).digest();
  const expected = createHmac('sha256', secret).update(checkString(payload)).digest('hex');

  return timingSafeEqual(hash, expected);
};

export const widgetIdentity = (payload: WidgetPayload): TelegramIdentity | null => {
  const { id, username, language_code: languageCode } = payload;

  if (isNullish(id) || !TELEGRAM_ID.test(id)) {
    return null;
  }

  return {
    telegramId: BigInt(id),
    username: username ?? null,
    languageCode: languageCode ?? null
  };
};
