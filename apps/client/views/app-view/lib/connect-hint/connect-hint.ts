import { match } from 'ts-pattern';

import type { NodeReachability } from '../node-reachability';

export const unavailableHintKey = (reachability: NodeReachability): string =>
  match(reachability)
    .with('probing', () => 'connectHintProbing')
    .with('unreachable', () => 'connectHintUnreachable')
    .otherwise(() => 'connectHintNoNode');
