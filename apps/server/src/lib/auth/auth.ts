import { Logger } from '@nestjs/common';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { bearer } from 'better-auth/plugins';
import { createElement } from 'react';

import { allowedOrigins } from '../../config/cors';
import { validateEnv } from '../../config/env.schema';
import { basePrisma } from '../../core';
import { ChangeEmail, ResetPassword, sendEmail, VerifyEmail } from '../email';
import { withClientCallback } from './auth-callback-url';
import { SESSION_EXPIRES_IN, SESSION_UPDATE_AGE } from './auth.constants';

const env = validateEnv(process.env);
const logger = new Logger('Auth');

export const auth = betterAuth({
  basePath: '/auth',
  baseURL: env.API_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: allowedOrigins,
  session: {
    expiresIn: SESSION_EXPIRES_IN,
    updateAge: SESSION_UPDATE_AGE
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: 'Сброс пароля GnomeVPN',
        react: createElement(ResetPassword, { url })
      });
    }
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: false,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      sendEmail({
        to: user.email,
        subject: 'Подтвердите почту GnomeVPN',
        react: createElement(VerifyEmail, { url: withClientCallback(url, '/account') })
      }).catch((error) => {
        logger.error(`verification email to ${user.email} failed`, error);
      });
    }
  },
  user: {
    changeEmail: {
      enabled: true,
      sendChangeEmailConfirmation: async ({ user, url, newEmail }) => {
        await sendEmail({
          to: user.email,
          subject: 'Подтвердите смену почты GnomeVPN',
          react: createElement(ChangeEmail, {
            newEmail,
            url: withClientCallback(url, '/account')
          })
        });
      }
    }
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
