import { randomBytes } from 'node:crypto';

import { AUTH_BYTES } from '../../xray.constants';

export const generateAuth = (): string => randomBytes(AUTH_BYTES).toString('hex');
