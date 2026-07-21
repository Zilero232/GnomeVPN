import type { UpsertNodeArgs, UpsertNodeResult } from './upsert-node.types';

export const upsertNode = async ({ prisma, input }: UpsertNodeArgs): Promise<UpsertNodeResult> => {
  const existing = await prisma.node.findFirst({
    where: { wireguardEndpoint: input.wireguardEndpoint },
  });

  if (existing) {
    const updated = await prisma.node.update({
      where: { id: existing.id },
      data: {
        country: input.country,
        countryCode: input.countryCode,
        city: input.city,
        wgEasyUrl: input.wgEasyUrl,
        wgEasyApiKeyEnvVar: input.wgEasyApiKeyEnvVar,
        isAvailable: true,
      },
    });

    return { id: updated.id, wasExisting: true };
  }

  const created = await prisma.node.create({
    data: {
      country: input.country,
      countryCode: input.countryCode,
      city: input.city,
      wireguardEndpoint: input.wireguardEndpoint,
      wgEasyUrl: input.wgEasyUrl,
      wgEasyApiKeyEnvVar: input.wgEasyApiKeyEnvVar,
      isAvailable: true,
    },
  });

  return { id: created.id, wasExisting: false };
};
