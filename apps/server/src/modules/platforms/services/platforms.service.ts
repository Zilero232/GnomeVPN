import type { Platform } from '@gnomevpn/schemas';

import { PLATFORMS } from '@gnomevpn/schemas';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PlatformsService {
  list(): Platform[] {
    return [...PLATFORMS];
  }
}
