import { millisecondsInDay } from 'date-fns/constants';
import { match } from 'ts-pattern';

import type { DaysLeftInput, StatusTextInput } from './status-text.types';

import { pluralize } from '../../../../common/lib';
import { BOT_TEXT, NEW_LINE } from '../../config';
import { fillText } from '../fill-text';
import { formatDate } from '../format-date';
import { html } from '../html';
import { planLabel } from '../plan-label';

export const daysLeft = ({ until, now, locale }: DaysLeftInput): string => {
  const text = BOT_TEXT[locale];
  const days = Math.max(0, Math.ceil((until.getTime() - now.getTime()) / millisecondsInDay));

  return `${days} ${pluralize({ count: days, forms: { one: text.dayOne, few: text.dayFew, many: text.dayMany }, locale })}`;
};

export const statusText = ({
  period,
  plan,
  currentPeriodEnd,
  cancelAtPeriodEnd,
  hasPaymentMethod,
  isRecurringAvailable,
  limits,
  locale,
  now = new Date()
}: StatusTextInput): string => {
  const text = BOT_TEXT[locale];

  if (period === 'none' || !currentPeriodEnd) {
    return text.inactive;
  }

  const isTrial = period === 'trial';
  const footnote = match({ isTrial, cancelAtPeriodEnd, canCharge: hasPaymentMethod && isRecurringAvailable })
    .with({ isTrial: true }, () => text.trialEnds)
    .with({ cancelAtPeriodEnd: true }, () => text.willNotRenew)
    .with({ canCharge: false }, () => text.renewManual)
    .otherwise(() => text.willRenew);

  const card = [
    fillText({ text: text.statusUntil, fill: { date: formatDate({ iso: currentPeriodEnd, locale }) } }),
    fillText({ text: text.statusLeft, fill: { days: daysLeft({ until: new Date(currentPeriodEnd), now, locale }) } }),
    fillText({ text: text.statusPlan, fill: { plan: isTrial ? text.trialPeriod : planLabel({ planId: plan, locale }) } }),
    fillText({ text: text.statusDevices, fill: { count: String(limits.deviceLimit) } })
  ].join(NEW_LINE);

  return html.paragraphs([text.statusTitle, `${html.quote(card)}${NEW_LINE}${html.italic(footnote)}`]);
};
