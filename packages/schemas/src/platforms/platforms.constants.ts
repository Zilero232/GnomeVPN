import { INCY_DOWNLOADS } from '../clients';

export const PLATFORM_IDS = ['ios', 'android', 'windows', 'macos', 'linux', 'tv'] as const;

export const PLATFORMS = PLATFORM_IDS.map((id) => ({ id, href: INCY_DOWNLOADS[id] }));
