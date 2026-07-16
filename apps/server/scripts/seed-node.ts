import { basePrisma } from '../src/core';

const main = async () => {
  const country = process.env.SEED_COUNTRY ?? 'Germany';
  const countryCode = process.env.SEED_COUNTRY_CODE ?? 'DE';
  const flagEmoji = process.env.SEED_FLAG ?? '🇩🇪';
  const city = process.env.SEED_CITY;
  const publicEndpoint = process.env.SEED_ENDPOINT;
  const wgEasyUrl = process.env.SEED_WG_EASY_URL;
  const wgEasyApiKeyRef = process.env.SEED_WG_EASY_KEY_REF ?? 'WG_EASY_KEY_DE';

  if (!publicEndpoint || !wgEasyUrl) {
    throw new Error('SEED_ENDPOINT and SEED_WG_EASY_URL are required');
  }

  if (!process.env[wgEasyApiKeyRef]) {
    process.stdout.write(
      `Warning: ${wgEasyApiKeyRef} is not set in this environment; connect will fail with NODE_UNAVAILABLE until it is.\n`,
    );
  }

  const existing = await basePrisma.node.findFirst({ where: { publicEndpoint } });

  const node = existing
    ? await basePrisma.node.update({
        where: { id: existing.id },
        data: { country, countryCode, flagEmoji, city, wgEasyUrl, wgEasyApiKeyRef, enabled: true },
      })
    : await basePrisma.node.create({
        data: {
          country,
          countryCode,
          flagEmoji,
          city,
          publicEndpoint,
          wgEasyUrl,
          wgEasyApiKeyRef,
          enabled: true,
        },
      });

  process.stdout.write(
    `${existing ? 'Updated' : 'Seeded'} node ${node.id} (${country}, ${publicEndpoint})\n`,
  );

  await basePrisma.$disconnect();
};

void main();
