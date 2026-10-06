import { describe, expect, it } from 'vitest';

import { SITE } from '@/shared/config';
import { ROUTES } from '@/shared/constants';
import { DEFAULT_LOCALE, localePath, LOCALES } from '@/shared/i18n';

import { passwordResetRedirect } from '../password-reset';

describe('passwordResetRedirect', () => {
  it('sends the reader back to the reset page in the language they asked from', () => {
    for (const locale of LOCALES) {
      expect(new URL(passwordResetRedirect(locale)).pathname).toBe(localePath({ path: ROUTES.resetPassword, locale }));
    }
  });

  it('keeps the default locale unprefixed, like every other link on the site', () => {
    expect(passwordResetRedirect(DEFAULT_LOCALE)).toBe(new URL(ROUTES.resetPassword, SITE.url).toString());
  });

  it('points at the public site, never at the API that sends the email', () => {
    expect(new URL(passwordResetRedirect(DEFAULT_LOCALE)).origin).toBe(new URL(SITE.url).origin);
  });
});
