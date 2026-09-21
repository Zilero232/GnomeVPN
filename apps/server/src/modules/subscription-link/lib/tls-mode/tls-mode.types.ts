import type { TLS_MODE } from './tls-mode.constants';

export type TlsMode = (typeof TLS_MODE)[keyof typeof TLS_MODE];
