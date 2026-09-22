import type { Plan, PlanId } from '@gnomevpn/schemas';

import type { BotLocale } from '../../telegram.types';

export type PlanButtonLabelInput = {
  plan: Plan;
  locale: BotLocale;
};

export type PlanLabelInput = {
  planId: PlanId;
  locale: BotLocale;
};
