import type { ClientLink } from '@gnomevpn/schemas';

import type { CopyInput } from '../../IncyCard.types';

export type OtherAppsListProps = {
  clients: ClientLink[];
  url: string;
  onCopy: (input: CopyInput) => Promise<void>;
};

export type ImportInput = {
  importUrl: string;
  id: string;
};
