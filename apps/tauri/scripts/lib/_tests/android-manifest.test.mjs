import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { patchManifest } from '../android-manifest.mjs';

const BARE = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.INTERNET" />
    <application android:label="GnomeVPN">
        <service
            android:name=".GnomeVpnService"
            android:exported="false" />
    </application>
</manifest>
`;

let dir;
let path;

const write = (xml) => {
  writeFileSync(path, xml, 'utf8');
};

const read = () => readFileSync(path, 'utf8');

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'gnomevpn-manifest-'));
  path = join(dir, 'AndroidManifest.xml');

  write(BARE);
});

afterEach(() => {
  rmSync(dir, { force: true, recursive: true });
});

describe('patchManifest', () => {
  it('reports that it changed a manifest it had to patch', () => {
    expect(patchManifest(path)).toBe(true);
  });

  it('adds every permission the app needs', () => {
    patchManifest(path);

    const xml = read();

    for (const permission of [
      'FOREGROUND_SERVICE',
      'FOREGROUND_SERVICE_SYSTEM_EXEMPTED',
      'POST_NOTIFICATIONS',
      'WAKE_LOCK',
      'ACCESS_NETWORK_STATE',
      'RECEIVE_BOOT_COMPLETED',
      'REQUEST_IGNORE_BATTERY_OPTIMIZATIONS'
    ]) {
      expect(xml).toContain(`android.permission.${permission}`);
    }
  });

  it('keeps the battery exemption, which dropStalePermissions used to delete on the same run', () => {
    patchManifest(path);

    expect(read()).toContain('REQUEST_IGNORE_BATTERY_OPTIMIZATIONS');
  });

  it('keeps ACCESS_NETWORK_STATE, without which registerNetworkCallback throws', () => {
    patchManifest(path);

    expect(read()).toContain('ACCESS_NETWORK_STATE');
  });

  it('leaves an already patched manifest alone, so a second run is a no-op', () => {
    patchManifest(path);

    const once = read();

    expect(patchManifest(path)).toBe(false);
    expect(read()).toBe(once);
  });

  it('never adds a permission twice', () => {
    patchManifest(path);
    patchManifest(path);

    const xml = read();
    const occurrences = xml.split('REQUEST_IGNORE_BATTERY_OPTIMIZATIONS').length - 1;

    expect(occurrences).toBe(1);
  });

  it('drops the foreground-service permissions tauri adds that this app must not ship', () => {
    write(
      BARE.replace(
        '<uses-permission android:name="android.permission.INTERNET" />',
        `<uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_VPN" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_SPECIAL_USE" />`
      )
    );

    patchManifest(path);

    const xml = read();

    expect(xml).not.toContain('FOREGROUND_SERVICE_VPN');
    expect(xml).not.toContain('FOREGROUND_SERVICE_SPECIAL_USE');
  });

  it('never deletes a permission it is also asked to insert', () => {
    patchManifest(path);

    const xml = read();

    expect(xml).toContain('FOREGROUND_SERVICE_SYSTEM_EXEMPTED');
  });

  it('puts the tunnel service in its own process, so it survives a task swipe', () => {
    patchManifest(path);

    expect(read()).toContain('android:process=":tunnel"');
  });

  it('does not add a second process attribute to a service that already has one', () => {
    patchManifest(path);
    patchManifest(path);

    const occurrences = read().split('android:process=":tunnel"').length - 1;

    expect(occurrences).toBe(1);
  });

  it('registers the tile service and the boot receiver', () => {
    patchManifest(path);

    const xml = read();

    expect(xml).toContain('.VpnTileService');
    expect(xml).toContain('.BootReceiver');
  });

  it('leaves the manifest parseable', () => {
    patchManifest(path);

    const xml = read();

    expect(xml.split('<manifest').length - 1).toBe(1);
    expect(xml.trimEnd().endsWith('</manifest>')).toBe(true);
  });
});
