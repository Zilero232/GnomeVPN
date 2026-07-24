export const QUERY_KEYS = {
  nodes: () => ['nodes'] as const,
  nodeLatency: () => ['node-latency'] as const,
  deviceUsage: () => ['device-usage'] as const,
  installedApps: () => ['installed-apps'] as const,
  subscriptionStatus: () => ['subscription-status'] as const,
  release: () => ['release'] as const,
  updateCheck: () => ['update-check'] as const,
  serviceStatus: () => ['service-status'] as const,
  configs: () => ['configs'] as const,
};
