'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { useFieldError } from '@/entities/app/locale';
import { FormField, Input, PasswordInput, SubmitButton } from '@/shared/ui';
import { type SignUpValues, signUpSchema, useSignUp } from '../model/use-sign-up';

import s from './SignUpForm.module.scss';

const DEFAULT_VALUES: SignUpValues = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
};

export const SignUpForm = () => {
  const t = useTranslations('auth');
  const fieldError = useFieldError();
  const { isPending, mutate } = useSignUp();

  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const onSubmit = handleSubmit((values) => {
    mutate(values, {
      onError: (error: Error) => toast.error(t(error.message)),
    });
  });

  return (
    <form className={s.form} onSubmit={onSubmit}>
      <FormField error={fieldError(errors.name)} htmlFor="signup-name" label={t('fields.name')}>
        <Input autoComplete="name" id="signup-name" {...register('name')} />
      </FormField>

      <FormField error={fieldError(errors.email)} htmlFor="signup-email" label={t('fields.email')}>
        <Input autoComplete="email" id="signup-email" type="email" {...register('email')} />
      </FormField>

      <FormField
        error={fieldError(errors.password)}
        htmlFor="signup-password"
        label={t('fields.password')}
      >
        <PasswordInput autoComplete="new-password" id="signup-password" {...register('password')} />
      </FormField>

      <FormField
        error={fieldError(errors.confirmPassword)}
        htmlFor="signup-confirm"
        label={t('fields.confirmPassword')}
      >
        <PasswordInput
          autoComplete="new-password"
          id="signup-confirm"
          {...register('confirmPassword')}
        />
      </FormField>

      <SubmitButton isPending={isPending}>{t('signUpAction')}</SubmitButton>
    </form>
  );
};
