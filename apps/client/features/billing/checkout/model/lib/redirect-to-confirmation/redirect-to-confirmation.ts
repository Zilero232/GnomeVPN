import { openExternal } from '@/shared/lib';

export const redirectToConfirmation = async (confirmationUrl: string | null): Promise<boolean> => {
  if (!confirmationUrl) {
    return false;
  }

  await openExternal(confirmationUrl);

  return true;
};
