import { isNonNullish } from 'remeda';

import type { RealityNode, ResolvedRealityNode } from './build-config.types';

export const hasReality = <T extends RealityNode>(node: T): node is ResolvedRealityNode<T> =>
  isNonNullish(node.realityPublicKey) && isNonNullish(node.realityShortId);
