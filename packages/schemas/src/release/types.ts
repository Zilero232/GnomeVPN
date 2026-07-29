import type { z } from 'zod';

import type { releaseAssetSchema, releasePlatformSchema, releaseSchema } from './outputs';

export type Release = z.infer<typeof releaseSchema>;
export type ReleaseAsset = z.infer<typeof releaseAssetSchema>;
export type ReleasePlatform = z.infer<typeof releasePlatformSchema>;
