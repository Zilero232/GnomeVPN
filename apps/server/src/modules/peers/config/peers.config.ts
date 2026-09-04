export const TUNNEL = {
  insecure: true,
  dns: ['1.1.1.1', '8.8.8.8']
} as const;

export const PEER_PREFIX = {
  session: 'app-',
  config: 'cfg-'
} as const;

export const WG = {
  listenPort: 51820,
  mtu: 1360,
  allowedIps: ['0.0.0.0/0'],
  subnet: '10.9.0.0/24',
  addressPrefix: 24,
  serverHostOffset: 1
} as const;

export const PEER_REF_SELECT = {
  id: true,
  nodeId: true,
  userId: true,
  kind: true,
  name: true,
  protocol: true,
  nodeCredential: true
} as const;
