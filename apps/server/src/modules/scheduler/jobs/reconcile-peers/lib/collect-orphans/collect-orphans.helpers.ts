import { PEER_PREFIX } from '../../../../../peers';

export const isServerOwned = (email: string): boolean => Object.values(PEER_PREFIX).some((prefix) => email.startsWith(prefix));
