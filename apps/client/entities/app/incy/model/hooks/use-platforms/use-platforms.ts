import { PLATFORMS } from '@gnomevpn/schemas';

import type { IncyPlatform } from '../../../config';

import { PLATFORM_ICONS } from '../../../config';

export const usePlatforms = (): IncyPlatform[] => PLATFORMS.map((platform) => ({ ...platform, icon: PLATFORM_ICONS[platform.id] }));
