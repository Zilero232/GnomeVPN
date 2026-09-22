import type { ClientId, ClientPlatform } from '@gnomevpn/schemas';

import type { BotLocale } from '../../telegram.types';

export type ClientNameInput = {
  id: ClientId;
  locale: BotLocale;
};

export type PlatformNamesInput = {
  platforms: ClientPlatform[];
  locale: BotLocale;
};
