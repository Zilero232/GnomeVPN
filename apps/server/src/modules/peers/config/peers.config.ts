export const TUNNEL = {
  insecure: true,
  dns: ['1.1.1.1', '8.8.8.8'],
  portRange: { from: 20_000, to: 45_000 }
} as const;

export const PEER_PREFIX = {
  session: 'app-',
  config: 'cfg-'
} as const;

export const WG = {
  listenPort: 51820,
  mtu: 1420,
  allowedIps: ['0.0.0.0/0'],
  subnet: '10.9.0.0/24',
  addressPrefix: 24,
  serverHostOffset: 1
} as const;
