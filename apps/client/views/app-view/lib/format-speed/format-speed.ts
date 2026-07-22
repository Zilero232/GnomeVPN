import prettyBytes from 'pretty-bytes';

// Link speed is quoted in bits per second everywhere else — a tunnel that shows
// bytes reads as eight times slower than the same line in any other client.
export const formatSpeed = (bytesPerSecond: number): string =>
  `${prettyBytes(bytesPerSecond, { bits: true })}/s`;
