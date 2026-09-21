import { isNullish } from 'remeda';

import type { TlsMode } from './tls-mode.types';

import { SING_BOX_AGENTS, TLS_MODE } from './tls-mode.constants';

export const tlsMode = (userAgent: string | null): TlsMode => {
  if (isNullish(userAgent)) {
    return TLS_MODE.pin;
  }

  return SING_BOX_AGENTS.some((agent) => agent.test(userAgent)) ? TLS_MODE.skipVerify : TLS_MODE.pin;
};
