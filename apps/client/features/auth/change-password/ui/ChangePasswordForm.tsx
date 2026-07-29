'use client';

import type { ChangePasswordValues } from '@gnomevpn/schemas';

import { changePasswordSchema } from '@gnomevpn/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { useErrorMessage, useFieldError, usePasswordLabels } from '@/entities/app/locale';
import { useChangePassword } from '@/entities/auth/user';
import { FormField, PasswordInput, SubmitButton } from '@/shared/ui';

import s from './ChangePasswordForm.module.scss';

const DEFAULT_VALUES: ChangePasswordValues = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
};

export const ChangePasswordForm = () => {
  const t = useTranslations('account.profile');
  const fieldError = useFieldError();
  const passwordLabels = usePasswordLabels();
  const errorMessage = useErrorMessage();

  const { isPending, mutate } = useChangePassword();

  const {
    formState: { errors, isDirty },
    handleSubmit,
    register,
    reset
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: DEFAULT_VALUES
  });

  const onSubmit = handleSubmit((values) => {
    mutate(values, {
      onSuccess: () => {
        toast.success(t('passwordChanged'));
        reset(DEFAULT_VALUES);
      },
      onError: (error: Error) => toast.error(errorMessage(error))
    });
  });

  return (
    <form className={s.form} onSubmit={onSubmit}>
      <FormField
        className={s.field}
        error={fieldError(errors.currentPassword)}
        htmlFor='profile-current-password'
        label={t('currentPasswordLabel')}
      >
        <PasswordInput
          autoComplete='current-password'
          id='profile-current-password'
          {...passwordLabels}
          {...register('currentPassword')}
        />
      </FormField>

      <FormField
        className={s.field}
        error={fieldError(errors.newPassword)}
        hint={t('passwordHint')}
        htmlFor='profile-new-password'
        label={t('newPasswordLabel')}
      >
        <PasswordInput
          autoComplete='new-password'
          id='profile-new-password'
          {...passwordLabels}
          {...register('newPassword')}
        />
      </FormField>

      <FormField
        className={s.field}
        error={fieldError(errors.confirmPassword)}
        htmlFor='profile-confirm-password'
        label={t('confirmPasswordLabel')}
      >
        <PasswordInput
          autoComplete='new-password'
          id='profile-confirm-password'
          {...passwordLabels}
          {...register('confirmPassword')}
        />
      </FormField>

      <SubmitButton disabled={!isDirty} isPending={isPending} size='md'>
        {t('changePassword')}
      </SubmitButton>
    </form>
  );
};
