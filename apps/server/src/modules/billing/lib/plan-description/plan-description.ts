import type { Plan } from '@gnomevpn/schemas';

import type { DescribeSubscriptionInput } from './plan-description.types';

import { MONTH_FORMS, SUBSCRIPTION_PREFIX } from '../../config';

const rules = new Intl.PluralRules('ru-RU');

const months = (count: number): string =>
  MONTH_FORMS[rules.select(count) as keyof typeof MONTH_FORMS] ?? MONTH_FORMS.many;

export const describeSubscription = ({ plan, kind }: DescribeSubscriptionInput): string =>
  `${SUBSCRIPTION_PREFIX[kind]} ${plan.months} ${months(plan.months)}`;

export const describePlan = (plan: Plan): string =>
  describeSubscription({ plan, kind: 'purchase' });

export const describeRenewal = (plan: Plan): string =>
  describeSubscription({ plan, kind: 'renewal' });
