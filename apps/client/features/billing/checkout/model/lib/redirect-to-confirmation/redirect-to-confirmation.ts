import { isBrowser } from '@/shared/lib';

export const redirectToConfirmation = (confirmationUrl: string | null): boolean => {
  if (!confirmationUrl || !isBrowser()) {
    return false;
  }

  window.location.assign(confirmationUrl);

  return true;
};
