'use client';

import type { ChangeEmailValues } from '@gnomevpn/schemas';

import { changeEmailSchema } from '@gnomevpn/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { useErrorMessage, useFieldError } from '@/entities/app/locale';
import { useChangeEmail, useCurrentUser } from '@/entities/auth/user';
import { FormField, Input, SubmitButton, Text } from '@/shared/ui';

import s from './ChangeEmailForm.module.scss';

const DEFAULT_VALUES: ChangeEmailValues = { newEmail: '' };

export const ChangeEmailForm = () => {
  const t = useTranslations('account.profile');
  const fieldError = useFieldError();
  const errorMessage = useErrorMessage();

  const { email } = useCurrentUser();
  const { isPending, mutate } = useChangeEmail();

  const {
    formState: { errors, isDirty },
    handleSubmit,
    register,
    reset
  } = useForm<ChangeEmailValues>({
    resolver: zodResolver(changeEmailSchema),
    defaultValues: DEFAULT_VALUES
  });

  const onSubmit = handleSubmit((values) => {
    mutate(values, {
      onSuccess: () => {
        toast.success(t('emailChangeRequested'));
        reset(DEFAULT_VALUES);
      },
      onError: (error: Error) => toast.error(errorMessage(error))
    });
  });

  return (
    <form className={s.form} onSubmit={onSubmit}>
      <div className={s.current}>
        <Text size='xs' tone='muted'>
          {t('currentEmailLabel')}
        </Text>
        <Text size='sm'>{email}</Text>
      </div>

      <FormField
        className={s.field}
        error={fieldError(errors.newEmail)}
        hint={t('emailChangeHint')}
        htmlFor='profile-new-email'
        label={t('newEmailLabel')}
      >
        <Input autoComplete='email' id='profile-new-email' type='email' {...register('newEmail')} />
      </FormField>

      <SubmitButton disabled={!isDirty} isPending={isPending} size='md'>
        {t('changeEmail')}
      </SubmitButton>
    </form>
  );
};
