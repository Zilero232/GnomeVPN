import { describe, expect, it } from 'vitest';

import { validateEnv } from '../env.schema';

const validEnv = {
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/gnome',
  DIRECT_URL: 'postgresql://user:pass@localhost:5432/gnome',
  API_URL: 'http://localhost:4000',
  BETTER_AUTH_SECRET: 'a-secret'
};

describe('validateEnv', () => {
  it('parses an env carrying every required variable', () => {
    expect(validateEnv(validEnv)).toMatchObject(validEnv);
  });

  it('applies the defaults for everything optional', () => {
    const parsed = validateEnv(validEnv);

    expect(parsed).toMatchObject({
      NODE_ENV: 'development',
      PORT: 4000,
      CORS_ORIGINS: 'http://localhost:3000',
      CLIENT_URL: 'http://localhost:3000',
      YOOKASSA_RETURN_URL: 'http://localhost:3000/account',
      YOOKASSA_RETURN_URL_DESKTOP: 'gnomevpn://account',
      SMTP_PORT: 465,
      GITHUB_TOKEN: ''
    });
  });

  it('throws when a required variable is missing', () => {
    const { DATABASE_URL, ...withoutDatabase } = validEnv;

    expect(() => validateEnv(withoutDatabase)).toThrow('Invalid environment:');
  });

  it('names the missing variable in the thrown message', () => {
    const { BETTER_AUTH_SECRET, ...withoutSecret } = validEnv;

    expect(() => validateEnv(withoutSecret)).toThrow(/BETTER_AUTH_SECRET/);
  });

  it('throws when a url variable is not a url', () => {
    expect(() => validateEnv({ ...validEnv, API_URL: 'not-a-url' })).toThrow('Invalid environment:');
  });

  it('throws when the auth secret is empty', () => {
    expect(() => validateEnv({ ...validEnv, BETTER_AUTH_SECRET: '' })).toThrow('Invalid environment:');
  });

  it('turns the string true into a real boolean', () => {
    expect(validateEnv({ ...validEnv, YOOKASSA_RECURRING: 'true' }).YOOKASSA_RECURRING).toBe(true);
  });

  it('turns the string false into a real boolean', () => {
    expect(validateEnv({ ...validEnv, SMTP_SECURE: 'false' }).SMTP_SECURE).toBe(false);
  });

  it('defaults the recurring flag to false and the smtp secure flag to true', () => {
    const parsed = validateEnv(validEnv);

    expect([parsed.YOOKASSA_RECURRING, parsed.SMTP_SECURE]).toEqual([false, true]);
  });

  it('rejects a boolean variable that is neither true nor false', () => {
    expect(() => validateEnv({ ...validEnv, YOOKASSA_RECURRING: 'yes' })).toThrow('Invalid environment:');
  });

  it('coerces a numeric port from its string form', () => {
    expect(validateEnv({ ...validEnv, PORT: '8080' }).PORT).toBe(8080);
  });

  it('rejects an unknown node environment', () => {
    expect(() => validateEnv({ ...validEnv, NODE_ENV: 'staging' })).toThrow('Invalid environment:');
  });

  it('rejects a malformed dev email override', () => {
    expect(() => validateEnv({ ...validEnv, DEV_EMAIL_OVERRIDE: 'nope' })).toThrow('Invalid environment:');
  });
});
