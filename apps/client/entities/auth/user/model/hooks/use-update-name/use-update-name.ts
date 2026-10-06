'use client';

import type { UpdateNameValues } from '@gnomevpn/schemas';

import { useMutation } from '@tanstack/react-query';

import { authClient, unwrapAuth } from '@/shared/api';

export const useUpdateName = () =>
  useMutation({
    mutationFn: async ({ name }: UpdateNameValues) => {
      unwrapAuth({ result: await authClient.updateUser({ name }), fallbackKey: 'errors.nameUpdateFailed' });
    }
  });
