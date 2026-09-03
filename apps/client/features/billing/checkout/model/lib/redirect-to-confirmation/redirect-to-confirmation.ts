import { isBrowser, isTauriDesktop, isTauriMobile, openExternal } from '@/shared/lib';

export const redirectToConfirmation = async (confirmationUrl: string | null): Promise<boolean> => {
  if (!confirmationUrl) {
    return false;
  }

  if (isBrowser() && !isTauriDesktop() && !isTauriMobile()) {
    window.location.assign(confirmationUrl);

    return true;
  }

  await openExternal(confirmationUrl);

  return true;
};
