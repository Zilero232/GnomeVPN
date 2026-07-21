import { z } from 'zod';

export const releasePlatformSchema = z.enum(['windows', 'android']);

export const releaseAssetSchema = z.object({
  platform: releasePlatformSchema,
  name: z.string().min(1),
  sizeBytes: z.number().int().nonnegative(),
  downloadUrl: z.url(),
});

export const releaseSchema = z.object({
  version: z.string().min(1),
  htmlUrl: z.url(),
  publishedAt: z.string().nullable(),
  assets: z.array(releaseAssetSchema),
});
