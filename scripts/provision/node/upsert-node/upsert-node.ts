import type { UpsertNodeArgs, UpsertNodeResult } from './upsert-node.types';

export const upsertNode = async ({ prisma, input }: UpsertNodeArgs): Promise<UpsertNodeResult> => {
  const { host, ...rest } = input;
  const existing = await prisma.node.findFirst({ where: { host } });

  // The host is what the row was found by, so an update leaves it alone.
  if (existing) {
    const updated = await prisma.node.update({
      where: { id: existing.id },
      data: { ...rest, isAvailable: true }
    });

    return { id: updated.id, wasExisting: true };
  }

  const created = await prisma.node.create({
    data: { ...input, isAvailable: true }
  });

  return { id: created.id, wasExisting: false };
};
