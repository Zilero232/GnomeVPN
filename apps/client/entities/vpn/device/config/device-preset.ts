import type { DevicePreset } from '../model/device-preset.types';

export const CUSTOM_DEVICE_PRESET = 'custom';

export const DEVICE_PRESETS: DevicePreset[] = [
  { id: 'phone', icon: 'smartphone' },
  { id: 'laptop', icon: 'laptop' },
  { id: 'tablet', icon: 'tablet' },
  { id: 'desktop', icon: 'monitor' },
  { id: 'router', icon: 'router' },
  { id: 'tv', icon: 'tv' }
];
