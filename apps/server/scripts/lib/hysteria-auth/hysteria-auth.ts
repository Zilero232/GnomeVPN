import { randomBytes } from 'node:crypto';

import { AUTH_BYTES } from './hysteria-auth.constants';

export const generateAuth = (): string => randomBytes(AUTH_BYTES).toString('hex');
