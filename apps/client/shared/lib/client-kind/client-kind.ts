import { isTauriDesktop } from '../tauri-platform';

import type { CheckoutClient } from '@gnomevpn/schemas';

export const clientKind = (): CheckoutClient => (isTauriDesktop() ? 'desktop' : 'web');
