import type { WebhookUrlInput } from './webhook-url.types';

import { WEBHOOK } from '../../config';

export const webhookUrl = ({ apiUrl, secret }: WebhookUrlInput): string | null => {
  if (!secret || !apiUrl.startsWith(WEBHOOK.httpsPrefix)) {
    return null;
  }

  return `${apiUrl.replace(WEBHOOK.trailingSlash, '')}/${WEBHOOK.path}`;
};
