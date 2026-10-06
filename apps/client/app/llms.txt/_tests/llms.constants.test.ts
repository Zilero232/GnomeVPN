import { describe, expect, it } from 'vitest';

import { indexedRoutes } from '@/shared/constants';

import { LLMS_PAGES } from '../llms.constants';

describe('LLMS_PAGES', () => {
  it('lists every indexed page, so llms.txt never knows less than the sitemap', () => {
    expect(LLMS_PAGES.map(({ path }) => path).sort()).toEqual(indexedRoutes().sort());
  });
});
