import { execFileSync } from 'node:child_process';
import { chmodSync, copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { isWindows, paths, reporter } from './lib/shell.mjs';

const SERVICE_HOLDS_ITS_BINARY = [
  'the running service holds its binary, so cargo kept the old build.',
  '  To pick up service changes, stop it from an elevated shell:',
  '    sc.exe stop GnomeVPNService'
].join('\n');

const BINARY = isWindows ? 'gnomevpn-service.exe' : 'gnomevpn-service';

const log = reporter('build-service');
const isRelease = process.argv.includes('--release');
const profile = isRelease ? 'release' : 'debug';

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

// Only Windows locks the file of a running process. On macOS and Linux cargo
// happily replaces a binary that is executing, so the staleness check — and the
// stop that goes with it — is Windows-only.
const stopRunningService = () => {
  if (!isWindows) {
    return;
  }

  try {
    execFileSync('sc', ['stop', 'GnomeVPNService'], { stdio: 'ignore' });
  } catch {}
};

const build = () => {
  stopRunningService();

  const args = ['build', '-p', 'gnomevpn-service', ...(isRelease ? ['--release'] : [])];

  execFileSync('cargo', args, { cwd: paths.workspace, stdio: 'inherit' });

  const binary = join(paths.target, profile, BINARY);

  if (!existsSync(binary)) {
    log.fail(`not found: ${binary}`);
  }

  if (isWindows && statSync(binary).mtimeMs < newestSourceMtime()) {
    reportStaleBinary();
  }

  return binary;
};

const publish = (binary) => {
  const target = join(paths.bin, 'service', BINARY);

  mkdirSync(dirname(target), { recursive: true });

  try {
    copyFileSync(binary, target);

    if (!isWindows) {
      chmodSync(target, 0o755);
    }
  } catch (error) {
    if (error.code !== 'EBUSY' && error.code !== 'EPERM') {
      throw error;
    }

    reportStaleBinary();
  }
};

publish(build());

log.info(`${BINARY} (${profile}) copied to bin/`);
