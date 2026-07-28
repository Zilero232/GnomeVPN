import { getAuthToken } from '@/shared/api';
import { env } from '@/shared/config';
import { isTauriMobile } from '@/shared/lib';

import type { VpnHeartbeat } from '@/shared/lib';

export const buildHeartbeat = (deviceId: string): VpnHeartbeat | undefined => {
  if (!isTauriMobile()) {
    return undefined;
  }

  const token = getAuthToken();

  if (!token) {
    return undefined;
  }

  return { apiUrl: env.NEXT_PUBLIC_API_URL.replace(/\/$/, ''), token, deviceId };
};
