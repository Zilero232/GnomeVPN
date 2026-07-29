import { copyFileSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { requireEnv } from '../lib/env.mjs';
import { $, isWindows, reporter, requireGh, workspace } from '../lib/shell.mjs';
import { releaseTag, releaseVersion } from './version.mjs';

const log = reporter('release:android');

const tag = releaseTag();
const version = releaseVersion();
const creds = requireEnv([
  'ANDROID_KEY_ALIAS',
  'ANDROID_KEY_PASSWORD',
  'ANDROID_KEY_BASE64',
  'ANDROID_HOME',
  'NEXT_PUBLIC_API_URL'
]);

const gh = await requireGh(log);

const tauri = join(workspace, 'apps', 'tauri');
const gen = join(tauri, 'gen', 'android');
const gradleFile = join(gen, 'app', 'build.gradle.kts');
const keystore = join(gen, 'gnomevpn.keystore');
const signingSnippet = join(tauri, 'scripts', 'android-signing.kts');

const writeKeystore = () => {
  log.step('materialize keystore from ANDROID_KEY_BASE64');
  writeFileSync(keystore, Buffer.from(creds.ANDROID_KEY_BASE64, 'base64'));
  writeFileSync(
    join(gen, 'keystore.properties'),
    [
      `keyAlias=${creds.ANDROID_KEY_ALIAS}`,
      `password=${creds.ANDROID_KEY_PASSWORD}`,
      'storeFile=../gnomevpn.keystore',
      ''
    ].join('\n')
  );
};

const patchGradle = () => {
  let gradle = readFileSync(gradleFile, 'utf8');

  if (!gradle.includes('import java.io.FileInputStream')) {
    gradle = gradle.replace(
      'import java.util.Properties',
      'import java.io.FileInputStream\nimport java.util.Properties'
    );
  }

  if (gradle.includes('signingConfigs')) {
    gradle = gradle.replace(
      / {4}signingConfigs \{[\s\S]*?\r?\n {4}\}\r?\n/,
      readFileSync(signingSnippet, 'utf8')
    );
  } else {
    const snippet = readFileSync(signingSnippet, 'utf8');
    gradle = gradle.replace('    buildTypes {', `${snippet}    buildTypes {`);
  }

  if (!gradle.includes('signingConfig = signingConfigs.getByName("release")')) {
    gradle = gradle.replace(
      'getByName("release") {',
      'getByName("release") {\n            signingConfig = signingConfigs.getByName("release")'
    );
  }

  writeFileSync(gradleFile, gradle);
  log.step('release signing wired into build.gradle.kts');
};

const findArtifact = (extension) => {
  const walk = (directory) =>
    readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
      const path = join(directory, entry.name);

      return entry.isDirectory() ? walk(path) : [path];
    });

  const isFinal = (path) => path.endsWith(extension) && /[/\\]outputs[/\\]/.test(path);
  const universal = walk(gen).filter((path) => isFinal(path) && /universal.*release/i.test(path));
  const release = walk(gen).filter((path) => isFinal(path) && /release/i.test(path));
  const match = universal[0] ?? release[0];

  if (!match) {
    log.fail(`no ${extension} produced under gen/android`);
  }

  return match;
};

const buildEnv = {
  ...process.env,
  NODE_ENV: 'production',
  NEXT_PUBLIC_API_URL: creds.NEXT_PUBLIC_API_URL
};

const androidBuild = (flag) => {
  log.step(`tauri android build ${flag}`);

  return $`bunx tauri android build ${flag} --target aarch64 --target x86_64`
    .cwd(tauri)
    .env(buildEnv);
};

log.step('build the client bundle');
await $`bun --filter @gnomevpn/client build`.cwd(workspace).env(buildEnv);

log.step('init android project');
await $`bunx tauri android init`.cwd(tauri).env(buildEnv);

log.step('apply app icons');
await $`bunx tauri icon icon.manifest.json -o icons`.cwd(tauri).env(buildEnv);

log.step('sync android overlay');
await $`node ./scripts/setup-android-libs.mjs`.cwd(tauri);

writeKeystore();
patchGradle();

await androidBuild('--apk');
const apk = findArtifact('.apk');

log.step('verify apk signature');
const buildTools = readdirSync(join(creds.ANDROID_HOME, 'build-tools')).sort().at(-1);
const apksigner = join(creds.ANDROID_HOME, 'build-tools', buildTools, 'apksigner.bat');
await $`${apksigner} verify --verbose ${apk}`;

await androidBuild('--aab');
const aab = findArtifact('.aab');

const staging = join(workspace, 'target', 'android-release');

mkdirSync(staging, { recursive: true });

const named = [
  { from: apk, to: join(staging, `GnomeVPN_${version}_android.apk`) },
  { from: aab, to: join(staging, `GnomeVPN_${version}_android.aab`) }
];

for (const { from, to } of named) {
  copyFileSync(from, to);
}

log.step(`upload apk + aab to ${tag}`);
await $`${gh} release upload ${tag} ${named.map((file) => file.to)} --clobber`;

log.info(`android published to ${tag}`);

log.step('stop the gradle daemon so the process can exit');
await $`${join(gen, isWindows ? 'gradlew.bat' : 'gradlew')} --stop`.cwd(gen).nothrow().quiet();

process.exit(0);
