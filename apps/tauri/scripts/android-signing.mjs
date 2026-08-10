import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { paths, reporter } from './lib/shell.mjs';

// `tauri android init` regenerates gen/android, so the release signing config
// cannot live there — it is re-applied here on every build, the same way
// setup-android-libs.mjs re-applies the Kotlin overlay.
const log = reporter('android-signing');

const REQUIRED = ['ANDROID_KEY_ALIAS', 'ANDROID_KEY_PASSWORD', 'ANDROID_KEY_BASE64'];

const missing = REQUIRED.filter((key) => !process.env[key]);

if (missing.length) {
  log.fail(`missing: ${missing.join(', ')} — generate a keystore with \`keytool -genkeypair\` and put the three values in the repository secrets`);
}

const gen = paths.generated;
const gradleFile = join(gen, 'app', 'build.gradle.kts');
const keystore = join(gen, 'gnomevpn.keystore');
const snippet = join(paths.tauri, 'scripts', 'android-signing.kts');

const writeKeystore = () => {
  writeFileSync(keystore, Buffer.from(process.env.ANDROID_KEY_BASE64, 'base64'));

  writeFileSync(
    join(gen, 'keystore.properties'),
    [`keyAlias=${process.env.ANDROID_KEY_ALIAS}`, `password=${process.env.ANDROID_KEY_PASSWORD}`, 'storeFile=../gnomevpn.keystore', ''].join('\n')
  );

  log.info('keystore materialised from ANDROID_KEY_BASE64');
};

const patchGradle = () => {
  const signing = readFileSync(snippet, 'utf8');

  let gradle = readFileSync(gradleFile, 'utf8');

  if (!gradle.includes('import java.io.FileInputStream')) {
    gradle = gradle.replace('import java.util.Properties', 'import java.io.FileInputStream\nimport java.util.Properties');
  }

  if (gradle.includes('signingConfigs')) {
    gradle = gradle.replace(/ {4}signingConfigs \{[\s\S]*?\r?\n {4}\}\r?\n/, signing);
  } else {
    gradle = gradle.replace('    buildTypes {', `${signing}    buildTypes {`);
  }

  if (!gradle.includes('signingConfig = signingConfigs.getByName("release")')) {
    gradle = gradle.replace('getByName("release") {', 'getByName("release") {\n            signingConfig = signingConfigs.getByName("release")');
  }

  writeFileSync(gradleFile, gradle);

  log.info('release signing wired into build.gradle.kts');
};

writeKeystore();
patchGradle();
