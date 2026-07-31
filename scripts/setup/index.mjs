import { $, workspace } from '@gnomevpn/scripts/local';
import { reporter } from '@gnomevpn/scripts/reporter';
import { copyFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const log = reporter('setup');

const envPath = join(workspace, '.env');

if (existsSync(envPath)) {
  log.info('.env already exists, leaving it alone');
} else {
  copyFileSync(join(workspace, '.env.example'), envPath);
  log.info('created .env from .env.example');
}

log.step('starting postgres');
await $`docker compose -f docker-compose.dev.yml up -d --wait`;

log.step('pushing the prisma schema');

const push = await $`bun --filter @gnomevpn/server db:push`.nothrow();

if (push.exitCode !== 0) {
  log.warn('db:push refused — the local database holds data the schema would drop.');
  log.warn('Review the warning above, then either migrate it or reset the dev database:');
  log.warn('  bun run dev:infra:down && docker volume rm gnomevpn_gnomevpn-postgres-data');
  log.fail('setup stopped before touching your data');
}

log.info('ready — run "bun run dev"');
