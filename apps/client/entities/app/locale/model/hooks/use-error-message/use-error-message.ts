'use client';

import { useTranslations } from 'next-intl';

import { errorMessageKey } from './use-error-message.helpers';

export const useErrorMessage = () => {
  const t = useTranslations();

  return (error: unknown) => t(errorMessageKey(error));
};
