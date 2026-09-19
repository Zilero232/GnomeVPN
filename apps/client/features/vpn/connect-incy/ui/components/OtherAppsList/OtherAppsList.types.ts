import type { ClientLink } from '@gnomevpn/schemas';

import type { CopyInput } from '../../IncyCard.types';

export type OtherAppsListProps = {
  clients: ClientLink[];
  url: string;
  onCopy: (input: CopyInput) => void;
};
