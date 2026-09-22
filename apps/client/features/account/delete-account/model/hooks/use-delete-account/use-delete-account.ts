'use client';

import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

import { useToastError } from '@/entities/app/locale';
import { deleteAccount, resetSession } from '@/shared/api';
import { ROUTES } from '@/shared/constants';
import { useRouter } from '@/shared/i18n/navigation';

import type { DeleteAccountState } from './use-delete-account.types';

export const useDeleteAccount = (): DeleteAccountState => {
  const router = useRouter();
  const toastError = useToastError();
  const [isOpen, setIsOpen] = useState(false);

  const { isPending, mutate } = useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      resetSession();
      router.replace(ROUTES.landing);
    },
    onError: toastError
  });

  return {
    isOpen,
    isPending,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    confirm: () => mutate()
  };
};
