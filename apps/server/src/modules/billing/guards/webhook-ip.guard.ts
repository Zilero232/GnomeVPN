import type { CanActivate, ExecutionContext } from '@nestjs/common';

import { Injectable } from '@nestjs/common';

import { AppForbiddenException } from '../../../common/exceptions';
import { isAllowedWebhookIp } from '../lib';

@Injectable()
export class WebhookIpGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ ip?: string; socket?: { remoteAddress?: string } }>();

    const ip = request.ip ?? request.socket?.remoteAddress ?? '';

    if (!isAllowedWebhookIp(ip)) {
      throw new AppForbiddenException('WEBHOOK_INVALID', 'Webhook source not allowed');
    }

    return true;
  }
}
