#!/usr/bin/env node
// Kills leftover GnomeVPN desktop processes so `tauri dev` can start cleanly.
// A crashed run leaves gnomevpn.exe holding the TUN adapter and the single-instance
// lock, which makes the next launch either fail or silently focus the zombie
// window. Protects the current/parent PID so the predev hook can't suicide.

import { execSync, spawnSync } from 'node:child_process';
import { platform } from 'node:os';

const PROCESS_NAMES = ['gnomevpn.exe', 'gnomevpn'];

const myPid = String(process.pid);
const parentPid = String(process.ppid);
const protect = new Set([myPid, parentPid]);

const run = (cmd) => {
  try {
    return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] }).toString();
  } catch {
    return '';
  }
};

const report = (pid, name) => {
  // biome-ignore lint/suspicious/noConsole: standalone CLI script, console is the output channel
  console.log(`[kill-app] killed PID ${pid} (${name})`);
};

const killWindows = () => {
  // `tasklist /FO CSV` lines look like:
  //   "gnomevpn.exe","12345","Console","1","52 000 КБ"
  const out = run('tasklist /FO CSV /NH');

  for (const line of out.split('\n')) {
    const match = line.match(/^"([^"]+)","(\d+)"/);

    if (!match) {
      continue;
    }

    const [, name, pid] = match;

    if (name.toLowerCase() !== 'gnomevpn.exe' || protect.has(pid)) {
      continue;
    }

    run(`taskkill /F /PID ${pid}`);
    report(pid, name);
  }
};

const killUnix = () => {
  for (const name of PROCESS_NAMES) {
    const out = spawnSync('pgrep', ['-x', name], { encoding: 'utf8' });

    if (out.status !== 0) {
      continue;
    }

    const pids = out.stdout
      .split('\n')
      .map((value) => value.trim())
      .filter((value) => value.length > 0 && !protect.has(value));

    for (const pid of pids) {
      run(`kill -9 ${pid}`);
      report(pid, name);
    }
  }
};

if (platform() === 'win32') {
  killWindows();
} else {
  killUnix();
}
