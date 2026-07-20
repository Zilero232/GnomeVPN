import { AppServiceUnavailableException } from '../exceptions';

// The node table stores the NAME of an env var, never the password itself.
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
