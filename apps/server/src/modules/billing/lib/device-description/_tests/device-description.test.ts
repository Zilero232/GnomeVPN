import { describe, expect, it } from 'vitest';

import { describeExtraDevices } from '../device-description';

describe('describeExtraDevices', () => {
  it('uses the singular form for one device', () => {
    expect(describeExtraDevices(1)).toBe('Дополнительные устройства GnomeVPN: 1 устройство');
  });

  it('uses the few form for two devices', () => {
    expect(describeExtraDevices(2)).toBe('Дополнительные устройства GnomeVPN: 2 устройства');
  });

  it('uses the many form for five devices', () => {
    expect(describeExtraDevices(5)).toBe('Дополнительные устройства GnomeVPN: 5 устройств');
  });

  it('uses the many form for zero devices', () => {
    expect(describeExtraDevices(0)).toBe('Дополнительные устройства GnomeVPN: 0 устройств');
  });

  it('uses the many form for eleven devices', () => {
    expect(describeExtraDevices(11)).toBe('Дополнительные устройства GnomeVPN: 11 устройств');
  });

  it('uses the singular form for twenty one devices', () => {
    expect(describeExtraDevices(21)).toBe('Дополнительные устройства GnomeVPN: 21 устройство');
  });

  it('uses the few form for twenty three devices', () => {
    expect(describeExtraDevices(23)).toBe('Дополнительные устройства GnomeVPN: 23 устройства');
  });
});
