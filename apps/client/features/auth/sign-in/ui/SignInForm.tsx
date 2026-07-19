'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { FormField, Input, PasswordInput, SubmitButton } from '@/shared/ui';
import { type SignInValues, signInSchema, useSignIn } from '../model/use-sign-in';

import s from './SignInForm.module.scss';

const DEFAULT_VALUES: SignInValues = { email: '', password: '' };

export const SignInForm = () => {
  const t = useTranslations('auth');
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
      onError: (error: Error) => toast.error(error.message),
    });
  });

  return (
    <form className={s.form} onSubmit={onSubmit}>
      <FormField error={errors.email?.message} htmlFor="signin-email" label={t('fields.email')}>
        <Input autoComplete="email" id="signin-email" type="email" {...register('email')} />
      </FormField>

      <FormField
        error={errors.password?.message}
        htmlFor="signin-password"
        label={t('fields.password')}
      >
        <PasswordInput
          autoComplete="current-password"
          id="signin-password"
          {...register('password')}
        />
      </FormField>

      <SubmitButton isPending={isPending}>{t('signInAction')}</SubmitButton>
    </form>
  );
};
