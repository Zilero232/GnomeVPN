import type { User } from 'grammy/types';

import { isNullish } from 'remeda';

import type { TelegramIdentity } from '../../telegram.types';

export const identityOf = (from: User | undefined): TelegramIdentity | null => {
  if (isNullish(from)) {
    return null;
  }

  return {
    telegramId: BigInt(from.id),
    username: from.username ?? null,
    languageCode: from.language_code ?? null
  };
};
