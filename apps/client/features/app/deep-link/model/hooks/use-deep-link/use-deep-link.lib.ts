import { ROUTES } from '@/shared/constants';

const HOST_TO_ROUTE: Record<string, string> = {
  account: ROUTES.account,
  app: ROUTES.app
};

export const routeForDeepLink = (urls: string[] | null) => {
  const raw = urls?.[0];

  if (!raw) {
    return null;
  }

  try {
    const host = new URL(raw).hostname;

    return HOST_TO_ROUTE[host] ?? null;
  } catch {
    return null;
  }
};
