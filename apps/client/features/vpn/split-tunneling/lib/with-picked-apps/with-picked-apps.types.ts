import type { InstalledApp } from '@/shared/lib';

export type WithPickedAppsInput = {
  apps: InstalledApp[];
  picked: string[];
};
