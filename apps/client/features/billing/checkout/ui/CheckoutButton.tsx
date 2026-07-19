'use client';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { SubmitButton } from '@/shared/ui';
import { useCheckout } from '../model/use-checkout';

export const CheckoutButton = () => {
  const t = useTranslations('account');
  const { isPending, mutate } = useCheckout();

  const onClick = () => {
    mutate(undefined, {
      onError: (error: Error) => toast.error(error.message),
    });
  };

  return (
    <SubmitButton isPending={isPending} type="button" onClick={onClick}>
      {t('pay')}
    </SubmitButton>
  );
};
