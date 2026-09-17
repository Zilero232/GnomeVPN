import { env } from '@/shared/config';
import { serverLogger } from '@/shared/lib/server-logger';

// Reading env parses the schema, which throws on a missing or malformed
// NEXT_PUBLIC_* value. Doing it here fails the container on boot rather than on
// whichever request first renders a page that reads it.
serverLogger.info('web server ready', {
  version: env.NEXT_PUBLIC_APP_VERSION,
  apiUrl: env.NEXT_PUBLIC_API_URL
});
