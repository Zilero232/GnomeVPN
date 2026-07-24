import { Controller, Query, Sse, UnauthorizedException } from '@nestjs/common';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { from, interval, map, merge, switchMap } from 'rxjs';

import { resolveUser } from './lib';
import { EventsService } from './services';

import type { MessageEvent } from '@nestjs/common';
import type { Observable } from 'rxjs';

const KEEP_ALIVE_MS = 25_000;

@Controller('events')
export class EventsController {
  constructor(private readonly events: EventsService) {}

  @AllowAnonymous()
  @Sse()
  stream(@Query('token') token?: string): Observable<MessageEvent> {
    return from(resolveUser(token)).pipe(
      switchMap((userId: string | null): Observable<MessageEvent> => {
        if (!userId) {
          throw new UnauthorizedException();
        }

        const events = this.events
          .stream(userId)
          .pipe(map((event): MessageEvent => ({ data: event })));

        const keepAlive = interval(KEEP_ALIVE_MS).pipe(
          map((): MessageEvent => ({ type: 'ping', data: '' })),
        );

        return merge(events, keepAlive);
      }),
    );
  }
}
