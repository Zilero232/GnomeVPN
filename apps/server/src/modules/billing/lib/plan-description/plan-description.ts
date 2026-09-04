import type { Plan } from '@gnomevpn/schemas';

import type { DescribeSubscriptionInput } from './plan-description.types';

import { MONTH_FORMS, SUBSCRIPTION_PREFIX } from '../../config';
import { pluralize } from '../pluralize';

export const describeSubscription = ({ plan, kind }: DescribeSubscriptionInput): string =>
  `${SUBSCRIPTION_PREFIX[kind]} ${plan.months} ${pluralize({ count: plan.months, forms: MONTH_FORMS })}`;

export const describePlan = (plan: Plan): string => describeSubscription({ plan, kind: 'purchase' });

export const describeRenewal = (plan: Plan): string => describeSubscription({ plan, kind: 'renewal' });
