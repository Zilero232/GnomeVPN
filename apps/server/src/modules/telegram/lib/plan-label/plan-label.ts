import type { PlanId } from '@gnomevpn/schemas';

import { PLANS } from '@gnomevpn/schemas';

import type { PlanButtonLabelInput, PlanLabelInput } from './plan-label.types';

import { BOT_TEXT } from '../../config';

export const planButtonLabel = ({ plan, locale }: PlanButtonLabelInput): string =>
  `${plan.months} ${BOT_TEXT[locale].monthShort} — ${plan.priceRub} ₽`;

export const planLabel = ({ planId, locale }: PlanLabelInput): string => {
  const plan = PLANS.find((each) => each.id === planId);

  if (!plan) {
    return planId;
  }

  return `${plan.months} ${BOT_TEXT[locale].monthShort}`;
};

export const parsePlanId = (raw: string): PlanId | null => PLANS.find((plan) => plan.id === raw)?.id ?? null;
