import { CLIENT_PLATFORMS, INCY_DOWNLOADS } from '../clients';

export const PLATFORM_IDS = CLIENT_PLATFORMS;

export const PLATFORMS = PLATFORM_IDS.map((id) => ({ id, href: INCY_DOWNLOADS[id] }));
