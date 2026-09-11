import type { Prisma } from '../../../../../generated';

export type PeerKind = 'config' | 'session';

export type OwnersOfInput = {
  kind: PeerKind;
  state?: Prisma.PeerWhereInput['state'];
  user: Prisma.UserWhereInput;
};

export type SweepInput = {
  act: (userId: string) => Promise<unknown>;
  kind: PeerKind;
  state?: Prisma.PeerWhereInput['state'];
  user: Prisma.UserWhereInput;
};
