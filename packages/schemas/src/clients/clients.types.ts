import type { z } from 'zod';

import type { CLIENT_IMPORT_STYLE } from './clients.constants';
import type { clientIdSchema, clientLinkSchema, clientPlatformSchema } from './clients.schemas';

export type ClientId = z.infer<typeof clientIdSchema>;

export type ClientPlatform = z.infer<typeof clientPlatformSchema>;

export type ClientLink = z.infer<typeof clientLinkSchema>;

export type ClientImportStyle = (typeof CLIENT_IMPORT_STYLE)[keyof typeof CLIENT_IMPORT_STYLE];

export type ClientImport = {
  prefix: string;
  style: ClientImportStyle;
};

export type ClientEntry = {
  downloadUrl: string;
  platforms: ClientPlatform[];
  isRecommended: boolean;
  import: ClientImport | null;
};
