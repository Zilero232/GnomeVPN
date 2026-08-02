import { validateEnv } from '../../config/env.schema';

const env = validateEnv(process.env);

export const withClientCallback = (url: string, path = '/'): string => {
  try {
    const parsed = new URL(url);

    parsed.searchParams.set('callbackURL', new URL(path, env.CLIENT_URL).toString());

    return parsed.toString();
  } catch {
    return url;
  }
};
