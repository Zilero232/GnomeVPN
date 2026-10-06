// The donor has to be a real TLS 1.3 site that is reachable from the node and
// that nobody would think to block. The client's ClientHello names it, so it
// must also be plausible traffic for the user's own network.
export const MASQUERADE_HOST = 'www.bing.com';

export const REALITY_DONOR = {
  dest: `${MASQUERADE_HOST}:443`,
  serverNames: [MASQUERADE_HOST]
} as const;
