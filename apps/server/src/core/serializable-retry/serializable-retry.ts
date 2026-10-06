import pRetry from 'p-retry';

import { isPrismaRequestError } from '../prisma';
import { SERIALIZABLE_RETRY } from './serializable-retry.constants';

const isSerializationFailure = (error: unknown): boolean => isPrismaRequestError(error) && error.code === SERIALIZABLE_RETRY.failureCode;

export const withSerializableRetry = <T>(run: () => Promise<T>): Promise<T> =>
  pRetry(run, {
    retries: SERIALIZABLE_RETRY.retries,
    minTimeout: SERIALIZABLE_RETRY.minTimeoutMs,
    shouldRetry: ({ error }) => isSerializationFailure(error)
  });
