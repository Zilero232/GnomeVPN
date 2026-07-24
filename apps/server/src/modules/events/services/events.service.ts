import { Injectable } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';

import type { ServerEvent } from '../events.types';

@Injectable()
export class EventsService {
  private readonly streams = new Map<string, Set<Subject<ServerEvent>>>();

  stream(userId: string): Observable<ServerEvent> {
    const subject = new Subject<ServerEvent>();
    const existing = this.streams.get(userId) ?? new Set();

    existing.add(subject);
    this.streams.set(userId, existing);

    return new Observable<ServerEvent>((subscriber) => {
      const subscription = subject.subscribe(subscriber);

      return () => {
        subscription.unsubscribe();

        const set = this.streams.get(userId);

        if (set) {
          set.delete(subject);

          if (set.size === 0) {
            this.streams.delete(userId);
          }
        }
      };
    });
  }

  publish(userId: string, event: ServerEvent): void {
    const set = this.streams.get(userId);

    if (!set) {
      return;
    }

    for (const subject of set) {
      subject.next(event);
    }
  }
}
