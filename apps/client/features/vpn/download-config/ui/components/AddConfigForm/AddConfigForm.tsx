'use client';

import { issueConfigSchema } from '@gnomevpn/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { useFieldError } from '@/entities/app/locale';
import { DEFAULT_PROTOCOL } from '@/entities/vpn/protocol';
import { CountryFlag, FormField, Input, Select, SubmitButton } from '@/shared/ui';
import { useIssueConfig } from '../../../model/hooks';
import { ProtocolPicker } from '../ProtocolPicker';

import s from './AddConfigForm.module.scss';

import type { IssueConfigRequest } from '@gnomevpn/schemas';
import type { z } from 'zod';
import type { AddConfigFormProps } from './AddConfigForm.types';

export const AddConfigForm = ({ nodes, configs, isFull, isDisabled }: AddConfigFormProps) => {
  const t = useTranslations('configs');
  const tv = useTranslations('validation');
  const fieldError = useFieldError();
  const issue = useIssueConfig();

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<z.input<typeof issueConfigSchema>, unknown, IssueConfigRequest>({
    resolver: zodResolver(issueConfigSchema),
    defaultValues: {
      name: '',
      nodeId: nodes[0]?.id ?? '',
      protocol: DEFAULT_PROTOCOL,
    },
  });

  const onSubmit = handleSubmit((input) => {
    const isTaken = configs.some(
      (config) =>
        config.name === input.name &&
        config.nodeId === input.nodeId &&
        config.protocol === input.protocol,
    );

    if (isTaken) {
      toast.error(tv('nameTaken'));

      return;
    }

    issue.mutate(input);
  });

  const nodeOptions = nodes.map((node) => ({
    value: node.id,
    label: (
      <span className={s.country}>
        <CountryFlag countryCode={node.countryCode} />
        {node.country}
      </span>
    ),
  }));

  return (
    <form className={s.form} onSubmit={onSubmit}>
      <div className={s.row}>
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
                options={nodeOptions}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </FormField>
      </div>

      <FormField hasFloatingError htmlFor="config-protocol" label={t('protocolLabel')}>
        <Controller
          control={control}
          name="protocol"
          render={({ field }) => (
            <ProtocolPicker
              isDisabled={isDisabled}
              value={field.value ?? DEFAULT_PROTOCOL}
              onChange={field.onChange}
            />
          )}
        />
      </FormField>

      <SubmitButton
        className={s.submit}
        disabled={isDisabled || isFull}
        isPending={issue.isPending}
        size="md"
      >
        {t('create')}
      </SubmitButton>
    </form>
  );
};
