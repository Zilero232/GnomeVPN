import { format } from 'date-fns';
import { enGB, ru } from 'date-fns/locale';

import type { StatusTextInput } from './status-text.types';

import { BOT_TEXT, TEXT_TOKEN } from '../../config';
import { planLabel } from '../plan-label';
import { DATE_FORMAT } from './status-text.constants';

const DATE_LOCALES = { ru, en: enGB };

export const statusText = ({ status, plan, isTrial, currentPeriodEnd, cancelAtPeriodEnd, limits, locale }: StatusTextInput): string => {
  const text = BOT_TEXT[locale];

  if (status !== 'active' || !currentPeriodEnd) {
    return text.inactive;
  }

  const until = format(new Date(currentPeriodEnd), DATE_FORMAT, { locale: DATE_LOCALES[locale] });

  const period = isTrial ? text.trialPeriod : planLabel({ planId: plan, locale });
  const renewal = cancelAtPeriodEnd ? text.willNotRenew : text.willRenew;

  return [
    text.activeUntil.replace(TEXT_TOKEN.date, until),
    text.planLine.replace(TEXT_TOKEN.plan, period),
    text.devicesLine.replace(TEXT_TOKEN.count, String(limits.deviceLimit)),
    isTrial ? text.trialEnds : renewal
  ].join('\n');
};
