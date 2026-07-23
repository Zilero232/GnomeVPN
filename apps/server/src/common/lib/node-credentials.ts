import { AppServiceUnavailableException } from '../exceptions';

export const resolveNodeApiKey = (ref: string): string => {
  const key = process.env[ref];

  if (!key) {
    throw new AppServiceUnavailableException(
      'NODE_UNAVAILABLE',
      `Missing ${ref} in the environment`,
    );
  }

  return key;
};
