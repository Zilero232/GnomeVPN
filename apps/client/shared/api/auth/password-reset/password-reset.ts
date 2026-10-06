import { SITE } from '@/shared/config';
import { ROUTES } from '@/shared/constants';
import { localePath } from '@/shared/i18n';

import type { RequestPasswordResetInput } from './password-reset.types';

import { authClient } from '../auth-client';
import { unwrapAuth } from '../unwrap-auth';

export const passwordResetRedirect = (locale: RequestPasswordResetInput['locale']): string =>
  new URL(localePath({ path: ROUTES.resetPassword, locale }), SITE.url).toString();

export const requestPasswordReset = async ({ email, locale }: RequestPasswordResetInput): Promise<void> => {
  const result = await authClient.requestPasswordReset({ email, redirectTo: passwordResetRedirect(locale) });

  unwrapAuth({ result, fallbackKey: 'errors.resetLinkFailed' });
};
