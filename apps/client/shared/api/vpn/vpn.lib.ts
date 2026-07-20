const FILENAME_PATTERN = /filename="?([^";]+)"?/i;

const FALLBACK_FILE_NAME = 'GnomeVPN.conf';

export const parseFileName = (contentDisposition: unknown): string => {
  if (typeof contentDisposition !== 'string') {
    return FALLBACK_FILE_NAME;
  }

  return FILENAME_PATTERN.exec(contentDisposition)?.[1] ?? FALLBACK_FILE_NAME;
};
