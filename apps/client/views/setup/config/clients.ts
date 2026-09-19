import { CLIENT_IDS, CLIENT_REGISTRY } from '@gnomevpn/schemas';

export const OTHER_CLIENT_IDS = CLIENT_IDS.filter((id) => !CLIENT_REGISTRY[id].isRecommended);

export const OTHER_CLIENT_STEPS = ['copy', 'add', 'connect'] as const;
