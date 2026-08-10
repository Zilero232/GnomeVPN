import { execFileSync } from 'node:child_process';
import { chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { isWindows, paths, reporter } from './lib/shell.mjs';

// Kept in step with bin/README.md. The build must carry the with_quic
// (Hysteria2) and with_gvisor (TUN) tags — the official release archives do.
const VERSION = '1.13.14';

const TARGETS = {
  'darwin-arm64': { archive: 'darwin-arm64.tar.gz', binary: 'sing-box' },
  'darwin-x64': { archive: 'darwin-amd64.tar.gz', binary: 'sing-box' },
  'linux-arm64': { archive: 'linux-arm64.tar.gz', binary: 'sing-box' },
  'linux-x64': { archive: 'linux-amd64.tar.gz', binary: 'sing-box' },
  'win32-x64': { archive: 'windows-amd64.zip', binary: 'sing-box.exe' }
};

const log = reporter('fetch-singbox');

const key = `${process.platform}-${process.arch}`;
const target = TARGETS[key];

if (!target) {
  log.fail(`no sing-box build for ${key} — add it to TARGETS or drop the binary into bin/singbox by hand`);
}

const destination = join(paths.bin, 'singbox', target.binary);

if (existsSync(destination) && !process.argv.includes('--force')) {
  log.info(`${target.binary} already present — pass --force to re-download`);
  process.exit(0);
}

const url = `https://github.com/SagerNet/sing-box/releases/download/v${VERSION}/sing-box-${VERSION}-${target.archive}`;

log.info(`downloading ${url}`);

const response = await fetch(url);

if (!response.ok) {
  log.fail(`download failed: ${response.status} ${response.statusText}`);
}

const workdir = mkdtempSync(join(tmpdir(), 'gnomevpn-singbox-'));
const archive = join(workdir, target.archive);

try {
  writeFileSync(archive, Buffer.from(await response.arrayBuffer()));

  // bsdtar ships with Windows 10+ and reads zip as well as tar.gz, so one
  // command covers every platform.
  execFileSync('tar', ['-xf', archive, '-C', workdir], { stdio: 'inherit' });

  const unpacked = readdirSync(workdir, { withFileTypes: true }).find((entry) => entry.isDirectory() && entry.name.startsWith('sing-box-'));

  if (!unpacked) {
    log.fail(`unexpected archive layout in ${workdir}`);
  }

  mkdirSync(join(paths.bin, 'singbox'), { recursive: true });
  copyFileSync(join(workdir, unpacked.name, target.binary), destination);

  if (!isWindows) {
    chmodSync(destination, 0o755);
  }
} finally {
  rmSync(workdir, { recursive: true, force: true });
}

log.info(`sing-box ${VERSION} ready at bin/singbox/${target.binary}`);
