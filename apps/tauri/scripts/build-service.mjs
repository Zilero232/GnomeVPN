import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { isWindows, paths, reporter } from './lib/shell.mjs';

const SERVICE_HOLDS_ITS_BINARY = [
  'the running service holds its binary, so cargo kept the old build.',
  '  To pick up service changes, stop it from an elevated shell:',
  '    sc.exe stop GnomeVPNService',
].join('\n');

const log = reporter('build-service');
const isRelease = process.argv.includes('--release');
const profile = isRelease ? 'release' : 'debug';

if (!isWindows) {
  process.exit(0);
}

const newestSourceMtime = () => {
  const walk = (directory) =>
    readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
      const path = join(directory, entry.name);

      return entry.isDirectory() ? walk(path) : [statSync(path).mtimeMs];
    });

  return Math.max(...walk(join(paths.workspace, 'crates', 'vpn-service', 'src')));
};

// A stale binary is fatal for a release — shipping unbuilt code is worse than
// failing — but during development the GUI must still start.
const reportStaleBinary = () => {
  if (isRelease) {
    log.fail(SERVICE_HOLDS_ITS_BINARY);
  }

  log.warn(SERVICE_HOLDS_ITS_BINARY);
  process.exit(0);
};

const build = () => {
  try {
    execFileSync('sc', ['stop', 'GnomeVPNService'], { stdio: 'ignore' });
  } catch {}

  const args = ['build', '-p', 'gnomevpn-service', ...(isRelease ? ['--release'] : [])];

  execFileSync('cargo', args, { cwd: paths.workspace, stdio: 'inherit' });

  const binary = join(paths.target, profile, 'gnomevpn-service.exe');

  if (!existsSync(binary)) {
    log.fail(`not found: ${binary}`);
  }

  if (statSync(binary).mtimeMs < newestSourceMtime()) {
    reportStaleBinary();
  }

  return binary;
};

const publish = (binary) => {
  const target = join(paths.bin, 'service', 'gnomevpn-service.exe');

  mkdirSync(dirname(target), { recursive: true });

  try {
    copyFileSync(binary, target);
  } catch (error) {
    if (error.code !== 'EBUSY' && error.code !== 'EPERM') {
      throw error;
    }

    reportStaleBinary();
  }
};

publish(build());

log.info(`gnomevpn-service.exe (${profile}) copied to bin/`);
