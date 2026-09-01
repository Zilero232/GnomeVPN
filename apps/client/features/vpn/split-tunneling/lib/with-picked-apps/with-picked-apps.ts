import type { InstalledApp } from '@/shared/lib';

import type { WithPickedAppsInput } from './with-picked-apps.types';

const nameOf = (path: string) => {
  const file = path.split(/[/\\]/).pop() ?? path;

  return file.replace(/\.(exe|app)$/i, '') || path;
};

export const withPickedApps = ({ apps, picked }: WithPickedAppsInput): InstalledApp[] => {
  const known = new Set(apps.map((app) => app.path.toLowerCase()));
  const extra = picked.filter((path) => !known.has(path.toLowerCase())).map((path) => ({ name: nameOf(path), path }));

  return [...extra, ...apps];
};
