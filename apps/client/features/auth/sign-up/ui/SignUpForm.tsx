'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';

import { useFieldError, usePasswordLabels, useToastError } from '@/entities/app/locale';
import { FormField, Input, PasswordInput, SubmitButton } from '@/ui-kit';

import type { SignUpValues } from '../model/hooks';

import { signUpSchema, useSignUp } from '../model/hooks';

import s from './SignUpForm.module.scss';

const DEFAULT_VALUES: SignUpValues = {
  name: '',
  email: '',
  password: '',
  confirmPassword: ''
};

export const SignUpForm = () => {
  const t = useTranslations('auth');
  const fieldError = useFieldError();
  const toastError = useToastError();
  const passwordLabels = usePasswordLabels();
  const { isPending, mutate } = useSignUp();

  const {
    formState: { errors },
    handleSubmit,
    register
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: DEFAULT_VALUES
  });

  const onSubmit = handleSubmit((values) => {
    mutate(values, {
      onError: toastError
    });
  });

  return (
    <form noValidate className={s.form} onSubmit={onSubmit}>
      <FormField error={fieldError(errors.name)} htmlFor='signup-name' label={t('fields.name')}>
        <Input autoComplete='name' id='signup-name' {...register('name')} />
      </FormField>

      <FormField error={fieldError(errors.email)} htmlFor='signup-email' label={t('fields.email')}>
        <Input autoComplete='email' id='signup-email' type='email' {...register('email')} />
      </FormField>

      <FormField error={fieldError(errors.password)} htmlFor='signup-password' label={t('fields.password')}>
        <PasswordInput autoComplete='new-password' id='signup-password' {...passwordLabels} {...register('password')} />
      </FormField>

      <FormField error={fieldError(errors.confirmPassword)} htmlFor='signup-confirm' label={t('fields.confirmPassword')}>
        <PasswordInput autoComplete='new-password' id='signup-confirm' {...passwordLabels} {...register('confirmPassword')} />
      </FormField>

      <SubmitButton isPending={isPending}>{t('signUpAction')}</SubmitButton>
    </form>
  );
};
