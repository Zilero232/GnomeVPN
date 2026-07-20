import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';

import { AppForbiddenException } from '../../../common/exceptions';
import { WEBHOOK_ALLOWED_PREFIXES } from '../config';

@Injectable()
export class WebhookIpGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<{ ip?: string; socket?: { remoteAddress?: string } }>();

    const ip = (request.ip ?? request.socket?.remoteAddress ?? '').replace('::ffff:', '');
    const isAllowed =
      ip.length > 0 && WEBHOOK_ALLOWED_PREFIXES.some((prefix) => ip.startsWith(prefix));

    if (!isAllowed) {
      throw new AppForbiddenException('WEBHOOK_INVALID', 'Webhook source not allowed');
    }

    return true;
  }
}
