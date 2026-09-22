'use client';

import type { ChangeEmailValues } from '@gnomevpn/schemas';

import { changeEmailSchema } from '@gnomevpn/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { useFieldError, useToastError } from '@/entities/app/locale';
import { useAccountIdentity, useChangeEmail } from '@/entities/auth/user';
import { FormField, Input, SubmitButton, Text } from '@/ui-kit';

import s from './ChangeEmailForm.module.scss';

const DEFAULT_VALUES: ChangeEmailValues = { newEmail: '' };

export const ChangeEmailForm = () => {
  const t = useTranslations('account.profile');
  const fieldError = useFieldError();
  const toastError = useToastError();

  const { email, hasEmail } = useAccountIdentity();
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
        toast.success(t(hasEmail ? 'emailChangeRequested' : 'emailAdded'));
        reset(DEFAULT_VALUES);
      },
      onError: toastError
    });
  });

  return (
    <form className={s.form} onSubmit={onSubmit}>
      <div className={s.current}>
        <Text size='xs' tone='muted'>
          {hasEmail ? t('currentEmailLabel') : t('addEmailTitle')}
        </Text>

        <Text size='sm' tone={hasEmail ? 'default' : 'muted'}>
          {hasEmail ? email : t('noEmail')}
        </Text>
      </div>

      <FormField
        className={s.field}
        error={fieldError(errors.newEmail)}
        hint={hasEmail ? t('emailChangeHint') : t('addEmailHint')}
        htmlFor='profile-new-email'
        label={t('newEmailLabel')}
      >
        <Input autoComplete='email' id='profile-new-email' type='email' {...register('newEmail')} />
      </FormField>

      <SubmitButton disabled={!isDirty} isPending={isPending} size='md'>
        {hasEmail ? t('changeEmail') : t('addEmail')}
      </SubmitButton>
    </form>
  );
};
