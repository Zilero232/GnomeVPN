import type { PanelOnlines } from '../panel-client';

export const collectOnlineEmails = (payload: PanelOnlines): Set<string> | null => {
  if (!payload) {
    return null;
  }

  if (Array.isArray(payload)) {
    return new Set(payload);
  }

  return new Set(Object.values(payload).flat());
};
