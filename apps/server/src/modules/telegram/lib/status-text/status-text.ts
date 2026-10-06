import { match } from 'ts-pattern';

import type { StatusTextInput } from './status-text.types';

import { BOT_TEXT, NEW_LINE } from '../../config';
import { fillText } from '../fill-text';
import { formatDate } from '../format-date';
import { planLabel } from '../plan-label';

export const statusText = ({
  status,
  plan,
  isTrial,
  currentPeriodEnd,
  cancelAtPeriodEnd,
  hasPaymentMethod,
  isRecurringAvailable,
  limits,
  locale
}: StatusTextInput): string => {
  const text = BOT_TEXT[locale];

  if (status !== 'active' || !currentPeriodEnd) {
    return text.inactive;
  }

  const until = formatDate({ iso: currentPeriodEnd, locale });

  const period = isTrial ? text.trialPeriod : planLabel({ planId: plan, locale });
  const canCharge = hasPaymentMethod && isRecurringAvailable;
  const renewal = match({ cancelAtPeriodEnd, canCharge })
    .with({ cancelAtPeriodEnd: true }, () => text.willNotRenew)
    .with({ canCharge: false }, () => text.renewManual)
    .otherwise(() => text.willRenew);

  return [
    fillText({ text: text.activeUntil, fill: { date: until } }),
    fillText({ text: text.planLine, fill: { plan: period } }),
    fillText({ text: text.devicesLine, fill: { count: String(limits.deviceLimit) } }),
    isTrial ? text.trialEnds : renewal
  ].join(NEW_LINE);
};
