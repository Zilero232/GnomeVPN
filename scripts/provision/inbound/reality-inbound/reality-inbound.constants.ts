// gRPC rather than raw TCP: the stream carries HTTP/2 frames, so a probe that
// fingerprints the bare REALITY handshake over TCP has one more layer to chew
// through. The service name is what the client asks for and must match on both
// ends.
export const REALITY_INBOUND = {
  tag: 'reality-in',
  network: 'grpc',
  serviceName: 'grpc',
  sniff: ['http', 'tls']
} as const;
