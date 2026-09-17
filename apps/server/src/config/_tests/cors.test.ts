import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const loadOrigins = async (env: Record<string, string>) => {
  vi.resetModules();

  for (const [key, value] of Object.entries(env)) {
    vi.stubEnv(key, value);
  }

  const module = await import('../cors');

  return module.allowedOrigins;
};

beforeEach(() => {
  vi.unstubAllEnvs();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('allowedOrigins', () => {
  it('keeps every origin listed in CORS_ORIGINS', async () => {
    const origins = await loadOrigins({
      CORS_ORIGINS: 'https://gnomevpn.ru,https://www.gnomevpn.ru',
      CLIENT_URL: 'https://gnomevpn.ru'
    });

    expect(origins).toContain('https://gnomevpn.ru');
    expect(origins).toContain('https://www.gnomevpn.ru');
  });

  it('trusts the client url even when CORS_ORIGINS forgets it, so an email link is never rejected', async () => {
    const origins = await loadOrigins({
      CORS_ORIGINS: 'https://admin.gnomevpn.ru',
      CLIENT_URL: 'https://gnomevpn.ru'
    });

    expect(origins).toContain('https://gnomevpn.ru');
  });

  it('reduces the client url to its origin, dropping any path', async () => {
    const origins = await loadOrigins({
      CORS_ORIGINS: 'https://admin.gnomevpn.ru',
      CLIENT_URL: 'https://gnomevpn.ru/account'
    });

    expect(origins).toContain('https://gnomevpn.ru');
    expect(origins).not.toContain('https://gnomevpn.ru/account');
  });

  it('does not list the same origin twice', async () => {
    const origins = await loadOrigins({
      CORS_ORIGINS: 'https://gnomevpn.ru',
      CLIENT_URL: 'https://gnomevpn.ru'
    });

    expect(origins.filter((origin) => origin === 'https://gnomevpn.ru')).toHaveLength(1);
  });

  it('trims whitespace around a listed origin', async () => {
    const origins = await loadOrigins({
      CORS_ORIGINS: ' https://gnomevpn.ru , https://admin.gnomevpn.ru ',
      CLIENT_URL: 'https://gnomevpn.ru'
    });

    expect(origins).toContain('https://admin.gnomevpn.ru');
  });

  it('allows nothing beyond the configured origins, now that the web client is the only caller', async () => {
    const origins = await loadOrigins({
      CORS_ORIGINS: 'https://gnomevpn.ru',
      CLIENT_URL: 'https://gnomevpn.ru'
    });

    expect(origins).toEqual(['https://gnomevpn.ru']);
  });

  it('drops an empty entry rather than trusting a blank origin', async () => {
    const origins = await loadOrigins({
      CORS_ORIGINS: 'https://gnomevpn.ru,,',
      CLIENT_URL: 'https://gnomevpn.ru'
    });

    expect(origins).not.toContain('');
  });
});
