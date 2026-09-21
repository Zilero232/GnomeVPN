export const FEED = {
  contentType: 'text/plain; charset=utf-8',
  path: '/sub',
  peerName: 'incy',
  deepLinkName: 'GnomeVPN',
  throttle: { ttl: 60_000, limit: 10 }
} as const;
