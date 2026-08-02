import type { UpsertNodeArgs, UpsertNodeResult } from './upsert-node.types';

export const upsertNode = async ({ prisma, input }: UpsertNodeArgs): Promise<UpsertNodeResult> => {
  const existing = await prisma.node.findFirst({
    where: { host: input.host }
  });

  if (existing) {
    const updated = await prisma.node.update({
      where: { id: existing.id },
      data: {
        country: input.country,
        countryCode: input.countryCode,
        city: input.city,
        port: input.port,
        serverName: input.serverName,
        hysteriaAuth: input.hysteriaAuth,
        wgPublicKey: input.wgPublicKey,
        apiUrl: input.apiUrl,
        apiTokenEnvVar: input.apiTokenEnvVar,
        isAvailable: true
      }
    });

    return { id: updated.id, wasExisting: true };
  }

  const created = await prisma.node.create({
    data: {
      country: input.country,
      countryCode: input.countryCode,
      city: input.city,
      host: input.host,
      port: input.port,
      serverName: input.serverName,
      hysteriaAuth: input.hysteriaAuth,
      wgPublicKey: input.wgPublicKey,
      apiUrl: input.apiUrl,
      apiTokenEnvVar: input.apiTokenEnvVar,
      isAvailable: true
    }
  });

  return { id: created.id, wasExisting: false };
};
