import { basePrisma } from '../src/core';
import { upsertNode } from './lib/upsert-node';

import type { PrismaLike } from './lib/upsert-node';

const prisma = basePrisma as unknown as PrismaLike;

const main = async () => {
  const country = process.env.SEED_COUNTRY ?? 'Germany';
  const countryCode = process.env.SEED_COUNTRY_CODE ?? 'DE';
  const city = process.env.SEED_CITY;
  const wireguardEndpoint = process.env.SEED_ENDPOINT;
  const wgEasyUrl = process.env.SEED_WG_EASY_URL;
  const wgEasyApiKeyEnvVar = process.env.SEED_WG_EASY_KEY_REF ?? 'WG_EASY_KEY_DE';

  if (!wireguardEndpoint || !wgEasyUrl) {
    throw new Error('SEED_ENDPOINT and SEED_WG_EASY_URL are required');
  }

  if (!process.env[wgEasyApiKeyEnvVar]) {
    process.stdout.write(
      `Warning: ${wgEasyApiKeyEnvVar} is not set in this environment; connect will fail with NODE_UNAVAILABLE until it is.\n`,
    );
  }

  const result = await upsertNode(prisma, {
    country,
    countryCode,
    city,
    wireguardEndpoint,
    wgEasyUrl,
    wgEasyApiKeyEnvVar,
  });

  process.stdout.write(
    `${result.wasExisting ? 'Updated' : 'Seeded'} node ${result.id} (${country}, ${wireguardEndpoint})\n`,
  );

  await basePrisma.$disconnect();
};

void main();
