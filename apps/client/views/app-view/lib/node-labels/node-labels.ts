import { match } from 'ts-pattern';

import type { NodeLabelInput, NodeLabelKeys } from './node-labels.types';

export const nodeLabelKeys = ({ reachability, status }: NodeLabelInput): NodeLabelKeys =>
  match({ reachability, status })
    .with({ reachability: 'probing' }, () => ({ tag: 'nodeProbing', hint: 'nodeProbing' }))
    .with({ reachability: 'unreachable', status: 'offline' }, () => ({ tag: 'nodeOffline', hint: 'nodeOfflineHint' }))
    .with({ reachability: 'unreachable' }, () => ({ tag: 'nodeUnreachable', hint: 'nodeUnreachableHint' }))
    .with({ status: 'degraded' }, () => ({ tag: 'nodeDegraded', hint: 'nodeDegraded' }))
    .otherwise(() => ({ tag: 'nodeOnline', hint: 'nodeOnline' }));
