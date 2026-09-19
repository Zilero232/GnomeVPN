'use client';

import { CLIENT_REGISTRY } from '@gnomevpn/schemas';
import { useTranslations } from 'next-intl';

import { CLIENT_ICONS } from '@/entities/app/incy';
import { LinkCard, Text } from '@/ui-kit';

import { OTHER_CLIENT_IDS, OTHER_CLIENT_STEPS } from '../../../config';
import { SetupSteps } from '../SetupSteps';

import s from './OtherClients.module.scss';

export const OtherClients = () => {
  const t = useTranslations('setup.other');

  return (
    <div className={s.root}>
      <Text as='p' tone='muted'>
        {t('intro')}
      </Text>

      <div className={s.grid}>
        {OTHER_CLIENT_IDS.map((id) => (
          <LinkCard
            key={id}
            hint={t(`clients.${id}.hint`)}
            href={CLIENT_REGISTRY[id].downloadUrl}
            icon={CLIENT_ICONS[id]}
            label={t(`clients.${id}.name`)}
          />
        ))}
      </div>

      <SetupSteps steps={OTHER_CLIENT_STEPS.map((step) => ({ key: step, title: t(`steps.${step}.title`), body: t(`steps.${step}.body`) }))} />

      <Text as='p' size='sm' tone='muted'>
        {t('note')}
      </Text>
    </div>
  );
};
