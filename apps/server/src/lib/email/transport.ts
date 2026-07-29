import { render } from '@react-email/render';
import nodemailer from 'nodemailer';

import type { SendEmailParams } from './email.types';

import { validateEnv } from '../../config/env.schema';
import { SMTP_TIMEOUTS } from './email.constants';

const env = validateEnv(process.env);

const isConfigured = Boolean(env.SMTP_HOST && env.SMTP_USER && env.EMAIL_FROM);

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE,
  auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
  ...SMTP_TIMEOUTS
});

export const sendEmail = async ({ to, subject, react }: SendEmailParams): Promise<void> => {
  if (!isConfigured) {
    throw new Error('Email is not configured: set SMTP_HOST, SMTP_USER and EMAIL_FROM');
  }

  const recipient =
    env.NODE_ENV !== 'production' && env.DEV_EMAIL_OVERRIDE ? env.DEV_EMAIL_OVERRIDE : to;

  const [html, text] = await Promise.all([render(react), render(react, { plainText: true })]);

  try {
    await transporter.sendMail({ from: env.EMAIL_FROM, to: recipient, subject, html, text });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error';

    throw new Error(`Failed to send email: ${message}`);
  }
};
