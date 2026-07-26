'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { useFieldError } from '@/entities/app/locale';
import { FormField, Input, PasswordInput, SubmitButton } from '@/shared/ui';
import { type SignInValues, signInSchema, useSignIn } from '../model/use-sign-in';

import s from './SignInForm.module.scss';

import type { SignInFormProps } from './SignInForm.types';

const DEFAULT_VALUES: SignInValues = { email: '', password: '' };

export const SignInForm = ({ onForgotPassword }: SignInFormProps) => {
  const t = useTranslations('auth');
  const fieldError = useFieldError();
  const { isPending, mutate } = useSignIn();

  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const onSubmit = handleSubmit((values) => {
    mutate(values, {
      onError: (error: Error) => toast.error(t(error.message)),
    });
  });

  return (
    <form className={s.form} onSubmit={onSubmit}>
      <FormField error={fieldError(errors.email)} htmlFor="signin-email" label={t('fields.email')}>
        <Input autoComplete="email" id="signin-email" type="email" {...register('email')} />
      </FormField>

      <FormField
        error={fieldError(errors.password)}
        htmlFor="signin-password"
        label={t('fields.password')}
      >
        <PasswordInput
          autoComplete="current-password"
          id="signin-password"
          {...register('password')}
        />
      </FormField>

      <button className={s.forgot} type="button" onClick={onForgotPassword}>
        {t('forgotPassword')}
      </button>

      <SubmitButton isPending={isPending}>{t('signInAction')}</SubmitButton>
    </form>
  );
};
