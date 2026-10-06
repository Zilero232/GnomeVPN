'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';

import { useFieldError, useToastError } from '@/entities/app/locale';
import { FormField, Input, SubmitButton, Text } from '@/ui-kit';

import type { ForgotPasswordValues } from '../model/hooks';
import type { ForgotPasswordFormProps } from './ForgotPasswordForm.types';

import { forgotPasswordSchema, useForgotPassword } from '../model/hooks';

import s from './ForgotPasswordForm.module.scss';

const DEFAULT_VALUES: ForgotPasswordValues = { email: '' };

export const ForgotPasswordForm = ({ onBack }: ForgotPasswordFormProps) => {
  const t = useTranslations('auth');
  const fieldError = useFieldError();
  const toastError = useToastError();
  const { isPending, isSuccess, mutate } = useForgotPassword();

  const {
    formState: { errors },
    handleSubmit,
    register
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: DEFAULT_VALUES
  });

  const onSubmit = handleSubmit((values) => {
    mutate(values, {
      onError: toastError
    });
  });

  if (isSuccess) {
    return (
      <div className={s.done}>
        <Text align='center' size='sm' tone='muted'>
          {t('resetLinkSent')}
        </Text>

        <button className={s.back} type='button' onClick={onBack}>
          {t('backToSignIn')}
        </button>
      </div>
    );
  }

  return (
    <form noValidate className={s.form} onSubmit={onSubmit}>
      <Text size='sm' tone='muted'>
        {t('forgotPasswordHint')}
      </Text>

      <FormField error={fieldError(errors.email)} htmlFor='forgot-email' label={t('fields.email')}>
        <Input autoComplete='email' id='forgot-email' type='email' {...register('email')} />
      </FormField>

      <SubmitButton isPending={isPending}>{t('sendResetLink')}</SubmitButton>

      <button className={s.back} type='button' onClick={onBack}>
        {t('backToSignIn')}
      </button>
    </form>
  );
};
