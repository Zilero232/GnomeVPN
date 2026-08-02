'use client';

import type { UpdateNameValues } from '@gnomevpn/schemas';

import { updateNameSchema } from '@gnomevpn/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { useErrorMessage, useFieldError } from '@/entities/app/locale';
import { useCurrentUser, useUpdateName } from '@/entities/auth/user';
import { FormField, Input, SubmitButton } from '@/shared/ui';

import s from './UpdateNameForm.module.scss';

export const UpdateNameForm = () => {
  const t = useTranslations('account.profile');
  const fieldError = useFieldError();
  const errorMessage = useErrorMessage();

  const { name } = useCurrentUser();
  const { isPending, mutate } = useUpdateName();

  const {
    formState: { errors, isDirty },
    handleSubmit,
    register,
    reset
  } = useForm<UpdateNameValues>({
    resolver: zodResolver(updateNameSchema),
    values: { name },
    resetOptions: { keepDirtyValues: true, keepErrors: true }
  });

  const onSubmit = handleSubmit((values) => {
    mutate(values, {
      onSuccess: () => {
        toast.success(t('nameUpdated'));
        reset(values);
      },
      onError: (error: Error) => toast.error(errorMessage(error))
    });
  });

  return (
    <form className={s.form} onSubmit={onSubmit}>
      <FormField className={s.field} error={fieldError(errors.name)} htmlFor='profile-name' label={t('nameLabel')}>
        <Input autoComplete='name' id='profile-name' {...register('name')} />
      </FormField>

      <SubmitButton disabled={!isDirty} isPending={isPending} size='md'>
        {t('saveName')}
      </SubmitButton>
    </form>
  );
};
