import type { IdentifiedNode } from '../../../../common/lib';
import type { NodeHealth } from '../../../../lib';

export type { IdentifiedNode as ProbeNodeRow } from '../../../../common/lib';

export type NoteLoadInput = {
  node: IdentifiedNode;
  health: NodeHealth;
};
