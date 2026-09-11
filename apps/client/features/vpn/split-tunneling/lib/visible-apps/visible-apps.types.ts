import type { InstalledApp } from '@/shared/lib';

export type VisibleAppsInput = {
  apps: InstalledApp[];
  picked: string[];
  query: string;
};
