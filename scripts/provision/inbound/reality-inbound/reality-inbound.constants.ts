export const REALITY_INBOUND_TAG = 'reality-in';

// gRPC rather than raw TCP: the stream carries HTTP/2 frames, so a probe that
// fingerprints the bare REALITY handshake over TCP has one more layer to chew
// through. The name is what the client asks for and must match on both ends.
export const REALITY_SERVICE_NAME = 'grpc';

export const REALITY_NETWORK = 'grpc';

export const SNIFF_PROTOCOLS = ['http', 'tls'];
