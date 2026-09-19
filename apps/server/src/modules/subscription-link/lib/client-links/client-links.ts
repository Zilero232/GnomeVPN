import type { ClientId, ClientLink } from '@gnomevpn/schemas';

import { CLIENT_IDS, CLIENT_IMPORT_STYLE, CLIENT_REGISTRY } from '@gnomevpn/schemas';
import { isNullish } from 'remeda';

import type { ClientLinksInput, ImportUrlInput } from './client-links.types';

import { INCY_CLIENT_ID } from './client-links.constants';

const importUrl = ({ url, entry }: ImportUrlInput): string | null => {
  if (isNullish(entry)) {
    return null;
  }

  return entry.style === CLIENT_IMPORT_STYLE.path ? `${entry.prefix}${url}` : `${entry.prefix}${encodeURIComponent(url)}`;
};

export const clientLinks = ({ url, deepLink }: ClientLinksInput): ClientLink[] =>
  CLIENT_IDS.map((id: ClientId) => {
    const { downloadUrl, platforms, isRecommended, import: entry } = CLIENT_REGISTRY[id];

    return {
      id,
      downloadUrl,
      platforms,
      isRecommended,
      importUrl: id === INCY_CLIENT_ID ? deepLink : importUrl({ url, entry })
    };
  });
