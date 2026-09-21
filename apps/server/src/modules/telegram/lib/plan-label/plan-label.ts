import type { PlanId } from '@gnomevpn/schemas';

import { PLANS } from '@gnomevpn/schemas';

import type { PlanButtonLabelInput } from './plan-label.types';

import { BOT_TEXT } from '../../config';

export const planButtonLabel = ({ plan, locale }: PlanButtonLabelInput): string =>
  `${plan.months} ${BOT_TEXT[locale].monthShort} — ${plan.priceRub} ₽`;

export const parsePlanId = (raw: string): PlanId | null => PLANS.find((plan) => plan.id === raw)?.id ?? null;
