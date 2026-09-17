import { PLATFORM_IDS, platformSchema } from '@gnomevpn/schemas';
import { describe, expect, it } from 'vitest';

import { PlatformsService } from '../platforms.service';

const platforms = new PlatformsService().list();

describe('PlatformsService', () => {
  it('offers every platform the schema declares, so the client never renders a gap', () => {
    expect(platforms.map((platform) => platform.id)).toEqual([...PLATFORM_IDS]);
  });

  it('returns rows the response schema accepts', () => {
    expect(platforms.every((platform) => platformSchema.safeParse(platform).success)).toBe(true);
  });

  it('points every platform somewhere distinct', () => {
    expect(new Set(platforms.map((platform) => platform.href)).size).toBe(platforms.length);
  });

  it('serves every download over https, since these links run installers', () => {
    expect(platforms.every((platform) => new URL(platform.href).protocol === 'https:')).toBe(true);
  });
});
