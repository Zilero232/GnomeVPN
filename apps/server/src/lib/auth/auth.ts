import { isPlaceholderEmail } from '@gnomevpn/schemas';
import { Logger } from '@nestjs/common';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { APIError, createAuthMiddleware } from 'better-auth/api';
import { bearer } from 'better-auth/plugins';
import { createElement } from 'react';

import { describeError } from '../../common/lib';
import { allowedOrigins } from '../../config/cors';
import { validateEnv } from '../../config/env.schema';
import { basePrisma } from '../../core';
import { ChangeEmail, ResetPassword, sendEmail, VerifyEmail } from '../email';
import { withClientCallback } from './auth-callback-url';
import { SESSION } from './auth.constants';
import { claimedEmail } from './claimed-email';

const env = validateEnv(process.env);
const logger = new Logger('Auth');

export const auth = betterAuth({
  basePath: '/auth',
  baseURL: env.API_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: allowedOrigins,
  session: SESSION,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: 'GnomeVPN password reset',
        react: createElement(ResetPassword, { url })
      });
    }
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: false,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      void sendEmail({
        to: user.email,
        subject: 'Confirm your GnomeVPN email',
        react: createElement(VerifyEmail, { url: withClientCallback({ url, path: '/account' }) })
      }).catch((error: unknown) => {
        logger.error(`verification email for ${user.id} failed: ${describeError(error)}`);
      });
    }
  },
  user: {
    changeEmail: {
      enabled: true,
      updateEmailWithoutVerification: true,
      sendChangeEmailConfirmation: async ({ user, url, newEmail }) => {
        await sendEmail({
          to: user.email,
          subject: 'Confirm your new GnomeVPN email',
          react: createElement(ChangeEmail, {
            newEmail,
            url: withClientCallback({ url, path: '/account' })
          })
        });
      }
    }
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      const email = claimedEmail({ path: ctx.path, body: ctx.body });

      if (email && isPlaceholderEmail(email)) {
        throw new APIError('BAD_REQUEST', { message: 'This address cannot be used' });
      }
    })
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await basePrisma.subscription.create({
            data: { userId: user.id }
          });
        }
      }
    }
  },
  plugins: [bearer()],
  database: prismaAdapter(basePrisma, { provider: 'postgresql' })
});
