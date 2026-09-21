import type { ClientId } from '@gnomevpn/schemas';

import type { BotLocale } from '../../telegram.types';

export type ClientNameInput = {
  id: ClientId;
  locale: BotLocale;
};
