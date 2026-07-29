import { NodeSSH } from 'node-ssh';

import { requireEnv } from '../lib/env.mjs';
import { $, reporter, workspace } from '../lib/shell.mjs';

const log = reporter('deploy:web');

const creds = requireEnv([
  'GITHUB_TOKEN',
  'GHCR_OWNER',
  'NEXT_PUBLIC_API_URL',
  'PROVISION_SSH_HOST',
  'PROVISION_SSH_USER',
  'PROVISION_SSH_PASSWORD',
  'PROVISION_DEPLOY_PATH'
]);

const owner = creds.GHCR_OWNER;
const apiUrl = creds.NEXT_PUBLIC_API_URL;
const port = process.env.PROVISION_SSH_PORT ?? '22';

const webImage = `ghcr.io/${owner}/gnomevpn-web`;
const apiImage = `ghcr.io/${owner}/gnomevpn-server`;

const dockerLogin = async () => {
  log.step(`docker login ghcr.io as ${owner}`);
  await $`docker login ghcr.io -u ${owner} --password-stdin < ${new Response(creds.GITHUB_TOKEN)}`;
};

const buildAndPush = async ({ image, dockerfile, buildArgs }) => {
  log.step(`build & push ${image}`);
  const args = buildArgs.flatMap((arg) => ['--build-arg', arg]);
  await $`docker build -f ${dockerfile} ${args} -t ${`${image}:latest`} .`;
  await $`docker push ${`${image}:latest`}`;
};

const hasMigrations = async () => {
  const files = await $`git ls-files apps/server/prisma/migrations/*/migration.sql`.text();

  return files.trim().length > 0;
};

const remote = async () => {
  const ssh = new NodeSSH();

  log.step(`ssh ${creds.PROVISION_SSH_USER}@${creds.PROVISION_SSH_HOST}`);
  await ssh.connect({
    host: creds.PROVISION_SSH_HOST,
    port: Number(port),
    username: creds.PROVISION_SSH_USER,
    password: creds.PROVISION_SSH_PASSWORD
  });

  const path = creds.PROVISION_DEPLOY_PATH;

  log.step('copy docker-compose.yml to VPS');
  await ssh.putFile(`${workspace}/docker-compose.yml`, `${path}/docker-compose.yml`);

  const exec = async (title, script) => {
    log.step(title);
    const result = await ssh.execCommand(`set -e; cd '${path}'; ${script}`);

    if (result.stdout) {
      log.info(result.stdout);
    }

    if (result.code !== 0) {
      ssh.dispose();
      log.fail(result.stderr || `remote command failed: ${title}`);
    }
  };

  await exec(
    'pull images and restart',
    'touch .env.nodes && docker compose pull web server && docker compose up -d && docker image prune -f'
  );

  if (await hasMigrations()) {
    await exec(
      'baseline migration history',
      'docker compose exec -T server bunx prisma migrate resolve --applied 20260723000000_baseline || true'
    );
    await exec('apply migrations', 'docker compose exec -T server bunx prisma migrate deploy');
  } else {
    log.warn('no migration files — skipping migrate deploy');
  }

  ssh.dispose();
};

await dockerLogin();
await buildAndPush({
  image: webImage,
  dockerfile: 'apps/client/Dockerfile',
  buildArgs: [`NEXT_PUBLIC_API_URL=${apiUrl}`]
});
await buildAndPush({ image: apiImage, dockerfile: 'apps/server/Dockerfile', buildArgs: [] });
await remote();

log.info('web + server deployed');

process.exit(0);
