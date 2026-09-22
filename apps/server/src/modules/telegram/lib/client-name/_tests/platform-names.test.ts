import { CLIENT_REGISTRY } from '@gnomevpn/schemas';
import { describe, expect, it } from 'vitest';

import { BOT_LOCALES, BOT_PLATFORMS } from '../../../config';
import { platformNames } from '../client-name';

describe('platformNames', () => {
  it('names every platform of a client in the locale it is asked for', () => {
    const { platforms } = CLIENT_REGISTRY.incy;

    for (const locale of BOT_LOCALES) {
      const named = platformNames({ platforms: [...platforms], locale });

      for (const platform of platforms) {
        expect(named).toContain(BOT_PLATFORMS[locale][platform]);
      }
    }
  });

  it('leaves no raw identifier in what a reader sees', () => {
    const named = platformNames({ platforms: ['ios', 'macos', 'tv'], locale: 'ru' });

    expect(named).not.toContain('ios');
    expect(named).not.toContain('macos');
    expect(named).not.toContain('tv');
  });

  it('translates every platform a client can declare', () => {
    const declared = new Set(Object.values(CLIENT_REGISTRY).flatMap((client) => client.platforms));

    for (const locale of BOT_LOCALES) {
      for (const platform of declared) {
        expect(BOT_PLATFORMS[locale][platform]).toBeTruthy();
      }
    }
  });
});
