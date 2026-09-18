import type { NodeTraffic } from '../../../../../lib';

export type UserinfoInput = {
  currentPeriodEnd: Date | null;
  traffic: NodeTraffic;
};
