export const HYSTERIA_INBOUND = {
  tag: 'hysteria-in',
  udpIdleTimeout: 180,
  sniff: ['http', 'tls', 'quic']
} as const;
