import prettyBytes from 'pretty-bytes';

export const formatBytes = (bytes: number): string => prettyBytes(bytes);
