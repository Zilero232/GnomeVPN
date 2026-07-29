import pRetry from 'p-retry';

import { Prisma } from '../../generated';

const SERIALIZATION_FAILURE = 'P2034';
const RETRIES = 4;
const MIN_TIMEOUT_MS = 25;

const isSerializationFailure = (error: unknown): boolean =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === SERIALIZATION_FAILURE;

export const withSerializableRetry = <T>(run: () => Promise<T>): Promise<T> =>
  pRetry(run, {
    retries: RETRIES,
    minTimeout: MIN_TIMEOUT_MS,
    shouldRetry: ({ error }) => isSerializationFailure(error)
  });
