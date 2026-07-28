import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

import { AppUnauthorizedException } from '../exceptions';

import type { UserSession } from '@thallesp/nestjs-better-auth';

export const CurrentUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<{ session?: UserSession }>();
    const userId = request.session?.user.id;

    if (!userId) {
      throw new AppUnauthorizedException('UNAUTHORIZED', 'Authentication required');
    }

    return userId;
  },
);
