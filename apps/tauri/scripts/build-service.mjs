import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const workspace = join(here, '..', '..', '..');
const isRelease = process.argv.includes('--release');
const profile = isRelease ? 'release' : 'debug';

if (process.platform !== 'win32') {
  process.exit(0);
}

try {
  execFileSync('sc', ['stop', 'GnomeVPNService'], { stdio: 'ignore' });
} catch {}

const args = ['build', '-p', 'gnomevpn-service'];

if (isRelease) {
  args.push('--release');
}

const newestSourceMtime = () => {
  const root = join(workspace, 'crates', 'vpn-service', 'src');
  const walk = (dir) =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const path = join(dir, entry.name);

      return entry.isDirectory() ? walk(path) : [statSync(path).mtimeMs];
    });

  return Math.max(...walk(root));
};

execFileSync('cargo', args, { cwd: workspace, stdio: 'inherit' });

const built = join(workspace, 'target', profile, 'gnomevpn-service.exe');

const SERVICE_IS_RUNNING =
  '[build-service] the running service holds its binary, so it keeps the old build.\n' +
  '  To pick up service changes, stop it from an elevated shell:\n' +
  '    sc.exe stop GnomeVPNService';

// A stale binary is fatal for a release — shipping unbuilt code is worse than
// failing — but during development the GUI must still start.
const fail = (message) => {
  console.error(message);
  process.exit(isRelease ? 1 : 0);
};

if (!existsSync(built)) {
  console.error(`[build-service] not found: ${built}`);
  process.exit(1);
}

if (statSync(built).mtimeMs < newestSourceMtime()) {
  fail(SERVICE_IS_RUNNING);
}

const target = join(here, '..', 'bin', 'service', 'gnomevpn-service.exe');
mkdirSync(dirname(target), { recursive: true });

try {
  copyFileSync(built, target);
} catch (error) {
  if (error.code === 'EBUSY' || error.code === 'EPERM') {
    fail(SERVICE_IS_RUNNING);
  } else {
    throw error;
  }
}

// biome-ignore lint/suspicious/noConsole: standalone CLI script, console is the output channel
console.log(`[build-service] gnomevpn-service.exe (${profile}) copied to bin/`);
