import type { Plan } from '@gnomevpn/schemas';

import type { DescribeSubscriptionInput } from './payment-description.types';

import { DEVICE_FORMS, EXTRA_DEVICES_PREFIX, MONTH_FORMS, SUBSCRIPTION_PREFIX } from '../../config';
import { pluralize } from '../pluralize';

export const describeSubscription = ({ plan, kind }: DescribeSubscriptionInput): string =>
  `${SUBSCRIPTION_PREFIX[kind]} ${plan.months} ${pluralize({ count: plan.months, forms: MONTH_FORMS })}`;

export const describePlan = (plan: Plan): string => describeSubscription({ plan, kind: 'purchase' });

export const describeRenewal = (plan: Plan): string => describeSubscription({ plan, kind: 'renewal' });

export const describeExtraDevices = (quantity: number): string =>
  `${EXTRA_DEVICES_PREFIX} ${quantity} ${pluralize({ count: quantity, forms: DEVICE_FORMS })}`;
