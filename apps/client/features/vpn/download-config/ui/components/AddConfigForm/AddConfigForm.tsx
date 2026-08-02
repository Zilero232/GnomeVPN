'use client';

import type { IssueConfigRequest } from '@gnomevpn/schemas';
import type { z } from 'zod';

import { issueConfigSchema } from '@gnomevpn/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { Controller, useForm } from 'react-hook-form';
import { isEmpty } from 'remeda';
import { toast } from 'sonner';

import { useFieldError } from '@/entities/app/locale';
import { DEFAULT_PROTOCOL } from '@/entities/vpn/protocol';
import { CountryFlag, FormField, Select, SubmitButton, Text } from '@/shared/ui';

import type { AddConfigFormProps } from './AddConfigForm.types';

import { useIssueConfig } from '../../../model/hooks';
import { DeviceNameField } from '../DeviceNameField';
import { ProtocolPicker } from '../ProtocolPicker';

import s from './AddConfigForm.module.scss';

export const AddConfigForm = ({ nodes, configs, isFull, isDisabled }: AddConfigFormProps) => {
  const t = useTranslations('configs');
  const tv = useTranslations('validation');
  const fieldError = useFieldError();
  const issue = useIssueConfig();

  const reachableNodes = nodes.filter((node) => node.status !== 'offline');

  const {
    control,
    formState: { errors },
    handleSubmit,
    watch
  } = useForm<z.input<typeof issueConfigSchema>, unknown, IssueConfigRequest>({
    resolver: zodResolver(issueConfigSchema),
    defaultValues: {
      name: '',
      nodeId: reachableNodes[0]?.id ?? '',
      protocol: DEFAULT_PROTOCOL
    }
  });

  const [nodeId, protocol] = watch(['nodeId', 'protocol']);

  const selectedNode = nodes.find((node) => node.id === nodeId);
  const isNodeOffline = isEmpty(reachableNodes) || selectedNode?.status === 'offline';

  const takenNames = configs.filter((config) => config.nodeId === nodeId && config.protocol === protocol).map((config) => config.name);

  const onSubmit = handleSubmit((input) => {
    const isTaken = configs.some((config) => config.name === input.name && config.nodeId === input.nodeId && config.protocol === input.protocol);

    if (isTaken) {
      toast.error(tv('nameTaken'));

      return;
    }

    issue.mutate(input);
  });

  const nodeOptions = nodes.map((node) => ({
    value: node.id,
    isDisabled: node.status === 'offline',
    title: node.status === 'offline' ? t('nodeOffline') : undefined,
    label: (
      <span className={s.country}>
        <CountryFlag countryCode={node.countryCode} />
        {node.country}
      </span>
    )
  }));

  return (
    <form className={s.form} onSubmit={onSubmit}>
      <div className={s.row}>
        <FormField hasFloatingError className={s.field} error={fieldError(errors.name)} htmlFor='config-name' label={t('nameLabel')}>
          <Controller
            render={({ field }) => (
              <DeviceNameField isDisabled={isDisabled} takenNames={takenNames} value={field.value ?? ''} onChange={field.onChange} />
            )}
            control={control}
            name='name'
          />
        </FormField>

        <FormField hasFloatingError className={s.field} htmlFor='config-node' label={t('countryLabel')}>
          <Controller
            render={({ field }) => (
              <Select id='config-node' isDisabled={isDisabled} options={nodeOptions} value={field.value} onChange={field.onChange} />
            )}
            control={control}
            name='nodeId'
          />
        </FormField>
      </div>

      <FormField hasFloatingError htmlFor='config-protocol' label={t('protocolLabel')}>
        <Controller
          control={control}
          name='protocol'
          render={({ field }) => <ProtocolPicker isDisabled={isDisabled} value={field.value ?? DEFAULT_PROTOCOL} onChange={field.onChange} />}
        />
      </FormField>

      {isNodeOffline && (
        <Text size='xs' tone='danger'>
          {t('nodeOfflineHint')}
        </Text>
      )}

      <SubmitButton className={s.submit} disabled={isDisabled || isFull || isNodeOffline} isPending={issue.isPending} size='md'>
        {t('create')}
      </SubmitButton>
    </form>
  );
};
