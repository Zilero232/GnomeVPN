export const REALITY_INBOUND_TAG = 'reality-in';

export const REALITY_LISTEN_PORT = 443;

// The donor has to be a real TLS 1.3 site that is reachable from the node and
// that nobody would think to block. The client's ClientHello names it, so it
// must also be plausible traffic for the user's own network.
export const REALITY_DEST = 'www.bing.com:443';

export const REALITY_SERVER_NAMES = ['www.bing.com'];

export const REALITY_KEY_PATH = '/etc/gnomevpn/reality.key';

export const REALITY_PUB_PATH = '/etc/gnomevpn/reality.pub';

export const REALITY_SID_PATH = '/etc/gnomevpn/reality.sid';

export const SNIFF_PROTOCOLS = ['http', 'tls'];
