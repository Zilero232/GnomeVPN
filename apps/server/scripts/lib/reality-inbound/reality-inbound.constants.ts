export const INBOUND_TAG = 'reality-in';

export const LISTEN_PORT = 443;

export const PANEL_PORT = 2053;

export const PANEL_PATH = 'gnomevpn';

// `www.microsoft.com` answers TLS 1.3 over HTTP/2 and passes `xray tls ping`,
// yet every REALITY handshake against it ends in "handshake did not complete
// successfully" — a node that connects and carries nothing. Verified on the
// node itself with a standalone REALITY server: this donor fails where
// cloudflare, apple and amd all complete the handshake and return the node's
// IP through the tunnel. Verify a replacement the same way, since answering
// TLS 1.3 correctly is not enough on its own.
export const DONOR_HOST = 'www.cloudflare.com';

export const DONOR_PORT = 443;

export const SNIFF_PROTOCOLS = ['http', 'tls', 'quic'];
