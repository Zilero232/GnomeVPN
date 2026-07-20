import type { PrismaLike, UpsertNodeInput, UpsertNodeResult } from './upsert-node.types';

export const upsertNode = async (
  prisma: PrismaLike,
  input: UpsertNodeInput,
): Promise<UpsertNodeResult> => {
  const existing = await prisma.node.findFirst({
    where: { publicEndpoint: input.publicEndpoint },
  });

  if (existing) {
    const updated = await prisma.node.update({
      where: { id: existing.id },
      data: {
        country: input.country,
        countryCode: input.countryCode,
        city: input.city,
        wgEasyUrl: input.wgEasyUrl,
        wgEasyApiKeyRef: input.wgEasyApiKeyRef,
        enabled: true,
      },
    });

    return { id: updated.id, wasExisting: true };
  }

  const created = await prisma.node.create({
    data: {
      country: input.country,
      countryCode: input.countryCode,
      city: input.city,
      publicEndpoint: input.publicEndpoint,
      wgEasyUrl: input.wgEasyUrl,
      wgEasyApiKeyRef: input.wgEasyApiKeyRef,
      enabled: true,
    },
  });

  return { id: created.id, wasExisting: false };
};
