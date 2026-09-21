import type { WebhookUrlInput } from './webhook-url.types';

import { HTTPS_PREFIX, TRAILING_SLASH, WEBHOOK_PATH } from '../../config';

export const webhookUrl = ({ apiUrl, secret }: WebhookUrlInput): string | null => {
  if (!secret || !apiUrl.startsWith(HTTPS_PREFIX)) {
    return null;
  }

  return `${apiUrl.replace(TRAILING_SLASH, '')}/${WEBHOOK_PATH}`;
};
