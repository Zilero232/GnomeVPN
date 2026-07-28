'use client';

import { toast } from 'sonner';

import { useErrorMessage } from '../use-error-message';

export const useToastError = () => {
  const errorMessage = useErrorMessage();

  return (error: unknown) => toast.error(errorMessage(error));
};
