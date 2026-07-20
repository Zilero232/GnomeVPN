'use client';

import { issueConfigSchema } from '@gnomevpn/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { Controller, useForm } from 'react-hook-form';

import { useFieldError } from '@/entities/app/locale';
import { FormField, Input, Select, SubmitButton } from '@/shared/ui';
import { useIssueConfig } from '../../../model/hooks';

import s from './AddConfigForm.module.scss';

import type { IssueConfigRequest } from '@gnomevpn/schemas';
import type { AddConfigFormProps } from './AddConfigForm.types';

export const AddConfigForm = ({ nodes, isDisabled }: AddConfigFormProps) => {
  const t = useTranslations('configs');
  const fieldError = useFieldError();
  const issue = useIssueConfig();

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<IssueConfigRequest>({
    resolver: zodResolver(issueConfigSchema),
    defaultValues: { name: '', nodeId: nodes[0]?.id ?? '' },
  });

  const onSubmit = handleSubmit((values) => issue.mutate(values, { onSuccess: () => reset() }));

  return (
    <form className={s.form} onSubmit={onSubmit}>
      <FormField
        className={s.field}
        error={fieldError(errors.name)}
        hasFloatingError
        htmlFor="config-name"
        label={t('nameLabel')}
      >
        <Input
          disabled={isDisabled}
          id="config-name"
          placeholder={t('namePlaceholder')}
          {...register('name')}
        />
      </FormField>

      <FormField
        className={s.field}
        hasFloatingError
        htmlFor="config-node"
        label={t('countryLabel')}
      >
        <Controller
          control={control}
          name="nodeId"
          render={({ field }) => (
            <Select
              id="config-node"
              isDisabled={isDisabled}
              options={nodes.map((node) => ({ value: node.id, label: node.country }))}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
      </FormField>

      <SubmitButton
        className={s.submit}
        disabled={isDisabled}
        isPending={issue.isPending}
        size="md"
      >
        {t('download')}
      </SubmitButton>
    </form>
  );
};
