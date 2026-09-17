import type { Instrumentation } from 'next';

import { isNonNullish, isObjectType } from 'remeda';

export const register = async () => {
  if (process.env.NEXT_RUNTIME !== 'nodejs') {
    return;
  }

  await import('./instrumentation.node');
};

export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  if (process.env.NEXT_RUNTIME !== 'nodejs') {
    return;
  }

  const { serverLogger } = await import('@/shared/lib/server-logger');

  serverLogger.error(error instanceof Error ? error.message : String(error), {
    path: request.path,
    method: request.method,
    routeType: context.routeType,
    routePath: context.routePath,
    routerKind: context.routerKind,
    digest: isObjectType(error) && isNonNullish(error) && 'digest' in error ? String(error.digest) : undefined
  });
};
