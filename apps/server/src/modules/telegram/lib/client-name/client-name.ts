import type { ClientId } from '@gnomevpn/schemas';

import { CLIENT_IDS, CLIENT_REGISTRY } from '@gnomevpn/schemas';

import type { ClientNameInput, PlatformNamesInput } from './client-name.types';

import { BOT_PLATFORMS, BOT_TEXT } from '../../config';
import { CLIENT_LABELS, RECOMMENDED_MARK } from './client-name.constants';

export const parseClientId = (raw: string): ClientId | null => CLIENT_IDS.find((id) => id === raw) ?? null;

export const clientName = ({ id, locale }: ClientNameInput): string => {
  const label = CLIENT_LABELS[id];

  return CLIENT_REGISTRY[id].isRecommended ? `${label} ${RECOMMENDED_MARK} ${BOT_TEXT[locale].appsRecommended}` : label;
};

export const platformNames = ({ platforms, locale }: PlatformNamesInput): string =>
  platforms.map((platform) => BOT_PLATFORMS[locale][platform]).join(', ');
