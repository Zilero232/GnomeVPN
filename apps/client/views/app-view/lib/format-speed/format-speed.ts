import prettyBytes from 'pretty-bytes';

export const formatSpeed = (bytesPerSecond: number): string =>
  `${prettyBytes(bytesPerSecond, { bits: true })}/s`;
