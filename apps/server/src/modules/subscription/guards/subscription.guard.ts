import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';

import { AppPaymentRequiredException } from '../../../common/exceptions';
import { SubscriptionService } from '../services';

import type { UserSession } from '@thallesp/nestjs-better-auth';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(private readonly subscription: SubscriptionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ session?: UserSession }>();
    const userId = request.session?.user.id ?? '';
    const hasAccess = await this.subscription.hasActiveAccess(userId);

    if (!hasAccess) {
      throw new AppPaymentRequiredException('PAYMENT_REQUIRED', 'Active subscription required');
    }

    return true;
  }
}
