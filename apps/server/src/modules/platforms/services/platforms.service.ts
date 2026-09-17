import type { Platform } from '@gnomevpn/schemas';

import { PLATFORM_IDS } from '@gnomevpn/schemas';
import { Injectable } from '@nestjs/common';

import { INCY_DOWNLOADS } from '../config';

@Injectable()
export class PlatformsService {
  list(): Platform[] {
    return PLATFORM_IDS.map((id) => ({ id, href: INCY_DOWNLOADS[id] }));
  }
}
