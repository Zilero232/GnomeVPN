import type { Prisma } from '../../../../../generated';

export type OwnersOfInput = {
  state?: Prisma.PeerWhereInput['state'];
  user: Prisma.UserWhereInput;
};

export type SweepInput = {
  act: (userId: string) => Promise<unknown>;
  state?: Prisma.PeerWhereInput['state'];
  user: Prisma.UserWhereInput;
};
