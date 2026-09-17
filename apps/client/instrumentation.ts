import type { Instrumentation } from 'next';

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
    digest: typeof error === 'object' && error !== null && 'digest' in error ? String(error.digest) : undefined,
    path: request.path,
    method: request.method,
    routerKind: context.routerKind,
    routeType: context.routeType,
    routePath: context.routePath
  });
};
