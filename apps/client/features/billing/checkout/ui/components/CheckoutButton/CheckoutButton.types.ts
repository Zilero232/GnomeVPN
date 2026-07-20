import type { PlanId } from '@gnomevpn/schemas';
import type { ReactNode } from 'react';

export type CheckoutButtonProps = {
  planId?: PlanId;
  className?: string;
  children?: ReactNode;
};
