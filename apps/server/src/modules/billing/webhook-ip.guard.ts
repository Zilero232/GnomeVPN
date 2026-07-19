import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';

import { AppForbiddenException } from '../../common/exceptions';

const ALLOWED_PREFIXES = [
  '185.71.76.',
  '185.71.77.',
  '77.75.153.',
  '77.75.154.',
  '77.75.156.',
  '77.75.158.',
  '2a02:5180:',
  '127.0.0.1',
  '::1',
];

@Injectable()
export class WebhookIpGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<{ ip?: string; socket?: { remoteAddress?: string } }>();

    const ip = (request.ip ?? request.socket?.remoteAddress ?? '').replace('::ffff:', '');
    const isAllowed = ip.length > 0 && ALLOWED_PREFIXES.some((prefix) => ip.startsWith(prefix));

    if (!isAllowed) {
      throw new AppForbiddenException('WEBHOOK_INVALID', 'Webhook source not allowed');
    }

    return true;
  }
}
