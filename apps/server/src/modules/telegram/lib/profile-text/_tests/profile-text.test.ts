import { LOWEST_MONTHLY_RUB } from '@gnomevpn/schemas';
import { describe, expect, it } from 'vitest';

import { BOT_LOCALES, BOT_PROFILE } from '../../../config';
import { profileText } from '../profile-text';
import { PRICE_TOKEN } from '../profile-text.constants';

describe('profileText', () => {
  it('leaves no placeholder for a reader to see', () => {
    for (const locale of BOT_LOCALES) {
      const filled = profileText(BOT_PROFILE[locale]);

      expect(filled.description).not.toContain(PRICE_TOKEN);
      expect(filled.shortDescription).not.toContain(PRICE_TOKEN);
    }
  });

  it('quotes the cheapest month rather than a number written by hand', () => {
    for (const locale of BOT_LOCALES) {
      const filled = profileText(BOT_PROFILE[locale]);

      expect(filled.description).toContain(String(LOWEST_MONTHLY_RUB));
      expect(filled.shortDescription).toContain(String(LOWEST_MONTHLY_RUB));
    }
  });

  it('keeps the name and the menu button untouched', () => {
    const source = BOT_PROFILE.ru;
    const filled = profileText(source);

    expect(filled.name).toBe(source.name);
    expect(filled.menuButton).toBe(source.menuButton);
  });
});
