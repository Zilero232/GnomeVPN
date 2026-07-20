'use client';

import { useTranslations } from 'next-intl';

import type { FieldError } from 'react-hook-form';

type LooseTranslator = (key: string) => string;

export const useFieldError = () => {
  const t = useTranslations() as unknown as LooseTranslator;

  return (error: FieldError | undefined): string | undefined =>
    error?.message ? t(error.message) : undefined;
};
