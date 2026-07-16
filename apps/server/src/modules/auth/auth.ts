import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { bearer } from 'better-auth/plugins';
import { allowedOrigins } from '../../config/cors';
import { validateEnv } from '../../config/env.schema';
import { basePrisma } from '../../core';

const env = validateEnv(process.env);

export const auth = betterAuth({
  basePath: '/auth',
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: allowedOrigins,
  emailAndPassword: { enabled: true, requireEmailVerification: false },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await basePrisma.subscription.create({
            data: { userId: user.id, status: 'active' },
          });
        },
      },
    },
  },
  plugins: [bearer()],
  database: prismaAdapter(basePrisma, { provider: 'postgresql' }),
});
