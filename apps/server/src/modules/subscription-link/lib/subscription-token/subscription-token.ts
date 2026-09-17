import { randomBytes } from 'node:crypto';

import { TOKEN_BYTES } from './subscription-token.constants';

export const generateSubscriptionToken = (): string => randomBytes(TOKEN_BYTES).toString('base64url');
