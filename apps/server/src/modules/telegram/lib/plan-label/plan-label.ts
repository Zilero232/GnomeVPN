import type { PlanId } from '@gnomevpn/schemas';

import { planDiscountPercent, planMonthlyRub, PLANS } from '@gnomevpn/schemas';
import { InlineKeyboard } from 'grammy';
import { firstBy } from 'remeda';

import type { BotLocale } from '../../telegram.types';
import type { PlanButtonLabelInput, PlanLabelInput } from './plan-label.types';

import { BOT_TEXT, CALLBACK_PREFIX, NEW_LINE } from '../../config';
import { fillLabel, fillText } from '../fill-text';
import { html } from '../html';

const BEST_PLAN = firstBy(PLANS, [(plan) => planDiscountPercent(plan.id), 'desc']);

const HIGHLIGHTED_PLAN_ID = planDiscountPercent(BEST_PLAN.id) > 0 ? BEST_PLAN.id : null;

export const planButtonLabel = ({ plan, locale }: PlanButtonLabelInput): string => {
  const text = BOT_TEXT[locale];
  const discount = planDiscountPercent(plan.id);
  const label = `${plan.months} ${text.monthShort} — ${plan.priceRub} ₽`;

  return discount > 0 ? `${label} · ${fillLabel({ text: text.planBest, fill: { percent: String(discount) } })}` : label;
};

export const planLabel = ({ planId, locale }: PlanLabelInput): string => {
  const plan = PLANS.find((each) => each.id === planId);

  return plan ? `${plan.months} ${BOT_TEXT[locale].monthShort}` : planId;
};

export const parsePlanId = (raw: string): PlanId | null => PLANS.find((plan) => plan.id === raw)?.id ?? null;

export const plansText = (locale: BotLocale): string => {
  const text = BOT_TEXT[locale];
  const lines = PLANS.map((plan) => {
    const perMonth = fillText({ text: text.planPerMonth, fill: { price: String(planMonthlyRub(plan.id)) } });

    return `${html.bold(planLabel({ planId: plan.id, locale }))} — ${plan.priceRub} ₽ · ${perMonth}`;
  });

  return html.paragraphs([text.choosePlan, html.quote(lines.join(NEW_LINE))]);
};

export const planKeyboard = (locale: BotLocale): InlineKeyboard =>
  InlineKeyboard.from(
    PLANS.map((plan) => {
      const style = plan.id === HIGHLIGHTED_PLAN_ID ? 'success' : undefined;

      return [InlineKeyboard.text({ text: planButtonLabel({ plan, locale }), style }, `${CALLBACK_PREFIX.plan}${plan.id}`)];
    })
  );
