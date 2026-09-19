import { z } from 'zod';

import { CLIENT_IDS, CLIENT_PLATFORMS } from './clients.constants';

export const clientIdSchema = z.enum(CLIENT_IDS);

export const clientPlatformSchema = z.enum(CLIENT_PLATFORMS);

export const clientLinkSchema = z.object({
  id: clientIdSchema,
  downloadUrl: z.url(),
  platforms: z.array(clientPlatformSchema).nonempty(),
  isRecommended: z.boolean(),
  importUrl: z.string().nullable()
});
