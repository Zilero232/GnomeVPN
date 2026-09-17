import { randomBytes } from 'node:crypto';

import { SUBSCRIPTION_TOKEN_BYTES } from '../../config';

export const generateSubscriptionToken = (): string => randomBytes(SUBSCRIPTION_TOKEN_BYTES).toString('base64url');
