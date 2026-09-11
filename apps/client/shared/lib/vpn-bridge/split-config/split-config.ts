import type { SplitConfig, SplitMode } from '@gnomevpn/schemas';

import { SPLIT_MODE } from '@gnomevpn/schemas';

const asMode = (value: unknown): SplitMode => (value === SPLIT_MODE.disallowed ? SPLIT_MODE.disallowed : SPLIT_MODE.allowed);

const asList = (value: unknown) => (Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : []);

export const emptySplitConfig = (): SplitConfig => ({
  appsMode: SPLIT_MODE.allowed,
  apps: [],
  ipsMode: SPLIT_MODE.allowed,
  ips: []
});

export const normalizeSplitConfig = (value: unknown): SplitConfig => {
  const source = (value ?? {}) as Record<string, unknown>;

  return {
    appsMode: asMode(source.appsMode),
    apps: asList(source.apps),
    ipsMode: asMode(source.ipsMode),
    ips: asList(source.ips)
  };
};
