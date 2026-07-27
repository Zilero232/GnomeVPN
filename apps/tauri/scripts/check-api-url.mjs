import { reporter } from './lib/shell.mjs';

const log = reporter('check-api-url');

const LOCAL_HOST = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?/;

const url = process.env.NEXT_PUBLIC_API_URL;

if (!url) {
  log.fail(
    'NEXT_PUBLIC_API_URL is unset, so the bundle would fall back to localhost. ' +
      'Use "bun run release:android", which loads .env.release, or set it explicitly.',
  );
}

if (LOCAL_HOST.test(url)) {
  log.fail(
    `NEXT_PUBLIC_API_URL points at ${url}, which is the phone's own loopback. ` +
      'Set it to the public API before building an APK for a device.',
  );
}

log.info(`api url is ${url}`);
