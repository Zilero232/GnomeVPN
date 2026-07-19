#!/usr/bin/env node
// Единственный источник версии — корневой package.json. Этот скрипт разносит её
// туда, где формат не позволяет прочитать её на лету: tauri.conf.json задаёт
// версию установщика, Cargo.toml — версию крейта. Подпакеты остаются на 0.0.0,
// их версии не публикуются.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const { version } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

const tauriConfPath = join(root, 'apps', 'tauri', 'tauri.conf.json');
const cargoTomlPath = join(root, 'apps', 'tauri', 'Cargo.toml');

const tauriConf = JSON.parse(readFileSync(tauriConfPath, 'utf8'));

tauriConf.version = version;

writeFileSync(tauriConfPath, `${JSON.stringify(tauriConf, null, 2)}\n`);

const cargoToml = readFileSync(cargoTomlPath, 'utf8').replace(
  /^version = "[^"]*"$/m,
  `version = "${version}"`,
);

writeFileSync(cargoTomlPath, cargoToml);

// biome-ignore lint/suspicious/noConsole: standalone CLI script, console is the output channel
console.log(`[sync-version] ${version} → tauri.conf.json, Cargo.toml`);
