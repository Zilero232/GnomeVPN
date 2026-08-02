'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { useFieldError, usePasswordLabels } from '@/entities/app/locale';
import { FormField, PasswordInput, SubmitButton } from '@/shared/ui';

import type { ResetPasswordValues } from '../model/hooks';
import type { ResetPasswordFormProps } from './ResetPasswordForm.types';

import { resetPasswordSchema, useResetPassword } from '../model/hooks';

import s from './ResetPasswordForm.module.scss';

const DEFAULT_VALUES: ResetPasswordValues = { newPassword: '', confirmPassword: '' };

export const ResetPasswordForm = ({ token, onDone }: ResetPasswordFormProps) => {
  const t = useTranslations('auth');
  const fieldError = useFieldError();
  const passwordLabels = usePasswordLabels();
  const { isPending, mutate } = useResetPassword();

  const {
    formState: { errors },
    handleSubmit,
    register
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: DEFAULT_VALUES
  });

  const onSubmit = handleSubmit((values) => {
    mutate(
      { ...values, token },
      {
        onSuccess: () => {
          toast.success(t('passwordReset'));
          onDone();
        },
        onError: (error: Error) => toast.error(t(error.message))
      }
    );
  });

  return (
    <form className={s.form} onSubmit={onSubmit}>
      <FormField error={fieldError(errors.newPassword)} htmlFor='reset-password' label={t('fields.password')}>
        <PasswordInput autoComplete='new-password' id='reset-password' {...passwordLabels} {...register('newPassword')} />
      </FormField>

      <FormField error={fieldError(errors.confirmPassword)} htmlFor='reset-confirm-password' label={t('fields.confirmPassword')}>
        <PasswordInput autoComplete='new-password' id='reset-confirm-password' {...passwordLabels} {...register('confirmPassword')} />
      </FormField>

      <SubmitButton isPending={isPending}>{t('resetPasswordAction')}</SubmitButton>
    </form>
  );
};
