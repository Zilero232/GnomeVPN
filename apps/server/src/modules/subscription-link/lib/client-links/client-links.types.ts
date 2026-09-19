import type { ClientImport } from '@gnomevpn/schemas';

export type ClientLinksInput = {
  url: string;
  deepLink: string;
};

export type ImportUrlInput = {
  url: string;
  entry: ClientImport | null;
};
