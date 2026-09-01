import { describe, expect, it } from 'vitest';

import { withPickedApps } from '../with-picked-apps';

const FIREFOX = { name: 'Firefox', path: 'C:\\Program Files\\Firefox\\firefox.exe' };
const CHROME = { name: 'Chrome', path: 'C:\\Program Files\\Chrome\\chrome.exe' };

describe('withPickedApps', () => {
  it('returns the scanned list unchanged when nothing was picked', () => {
    expect(withPickedApps({ apps: [FIREFOX], picked: [] })).toEqual([FIREFOX]);
  });

  it('lists a picked app the scan never found', () => {
    const listed = withPickedApps({ apps: [FIREFOX], picked: ['D:\\Games\\custom\\game.exe'] });

    expect(listed).toHaveLength(2);
    expect(listed[0]).toEqual({ name: 'game', path: 'D:\\Games\\custom\\game.exe' });
  });

  it('puts a picked app above the scanned ones so it is visible without scrolling', () => {
    const listed = withPickedApps({ apps: [FIREFOX, CHROME], picked: ['D:\\Games\\game.exe'] });

    expect(listed[0].path).toBe('D:\\Games\\game.exe');
  });

  it('does not duplicate an app the scan already reported', () => {
    const listed = withPickedApps({ apps: [FIREFOX], picked: [FIREFOX.path] });

    expect(listed).toEqual([FIREFOX]);
  });

  it('treats a path differing only in case as the same app', () => {
    const listed = withPickedApps({ apps: [FIREFOX], picked: [FIREFOX.path.toUpperCase()] });

    expect(listed).toEqual([FIREFOX]);
  });

  it('names a unix executable after its file', () => {
    const listed = withPickedApps({ apps: [], picked: ['/usr/bin/firefox'] });

    expect(listed[0]).toEqual({ name: 'firefox', path: '/usr/bin/firefox' });
  });

  it('drops the bundle suffix from a macos application', () => {
    const listed = withPickedApps({ apps: [], picked: ['/Applications/Safari.app'] });

    expect(listed[0].name).toBe('Safari');
  });

  it('keeps every picked app that the scan is missing', () => {
    const listed = withPickedApps({ apps: [FIREFOX], picked: ['D:\\a.exe', 'D:\\b.exe'] });

    expect(listed.map((app) => app.path)).toEqual(['D:\\a.exe', 'D:\\b.exe', FIREFOX.path]);
  });

  it('falls back to the raw path when it has no file part', () => {
    const listed = withPickedApps({ apps: [], picked: ['/'] });

    expect(listed[0]).toEqual({ name: '/', path: '/' });
  });
});
