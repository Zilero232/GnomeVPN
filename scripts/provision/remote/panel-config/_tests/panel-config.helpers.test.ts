import { describe, expect, it } from 'vitest';

import { CORE_SETTING } from '../panel-config.constants';
import { assertPanelAccepted, settingsKeepingCore } from '../panel-config.helpers';

describe('settingsKeepingCore', () => {
  it('keeps every setting the panel had and turns the restart off', () => {
    const raw = JSON.stringify({ success: true, obj: { webPort: 2053, [CORE_SETTING.restartOnClientDisable]: true } });

    expect(JSON.parse(settingsKeepingCore(raw))).toEqual({ webPort: 2053, [CORE_SETTING.restartOnClientDisable]: false });
  });

  it('refuses an empty answer rather than writing one setting over all of them', () => {
    expect(() => settingsKeepingCore('')).toThrow();
  });

  it('refuses an answer that is not json', () => {
    expect(() => settingsKeepingCore('<html>login</html>')).toThrow();
  });

  it('refuses a failed read', () => {
    expect(() => settingsKeepingCore(JSON.stringify({ success: false, msg: 'unauthorized', obj: {} }))).toThrow('unauthorized');
  });

  it('refuses an empty settings object', () => {
    expect(() => settingsKeepingCore(JSON.stringify({ success: true, obj: {} }))).toThrow();
  });
});

describe('assertPanelAccepted', () => {
  it('passes a successful save', () => {
    expect(() => assertPanelAccepted(JSON.stringify({ success: true, msg: 'saved' }))).not.toThrow();
  });

  it('reports the reason a save was refused, which an http 200 alone would have hidden', () => {
    expect(() => assertPanelAccepted(JSON.stringify({ success: false, msg: 'bad port' }))).toThrow('bad port');
  });
});
