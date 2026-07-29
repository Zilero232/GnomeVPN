import type { CheckoutClient } from '@gnomevpn/schemas';

import { isTauriDesktop } from '../tauri-platform';

export const clientKind = (): CheckoutClient => (isTauriDesktop() ? 'desktop' : 'web');
