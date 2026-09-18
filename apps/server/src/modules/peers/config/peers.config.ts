export const TUNNEL = {
  insecure: false,
  dns: ['1.1.1.1', '8.8.8.8']
} as const;

export const PEER_PREFIX = {
  session: 'app-',
  config: 'cfg-'
} as const;

export const PEER_PROTOCOL_SUFFIX = {
  hysteria2: '',
  vless: '-vl'
} as const;

export const REALITY = {
  listenPort: 443,
  fingerprint: 'chrome',
  flow: '',
  serviceName: 'grpc'
} as const;

export const REALITY_SHORT_ID_BYTES = 8;

export const PEER_REF_SELECT = {
  id: true,
  nodeId: true,
  userId: true,
  kind: true,
  name: true,
  protocol: true,
  nodeCredential: true
} as const;

export const NODE_ACCESS_SELECT = {
  apiUrl: true,
  apiTokenEnvVar: true
} as const;
