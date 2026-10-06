'use client';

import type { FieldError } from 'react-hook-form';

import { useTranslations } from 'next-intl';

export const useFieldError = () => {
  const t = useTranslations();

  return (error: FieldError | undefined): string | undefined => (error?.message ? t(error.message) : undefined);
};
