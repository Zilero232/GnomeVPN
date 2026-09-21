import type { Plan } from '@gnomevpn/schemas';

import type { BotLocale } from '../../telegram.types';

export type PlanButtonLabelInput = {
  plan: Plan;
  locale: BotLocale;
};
