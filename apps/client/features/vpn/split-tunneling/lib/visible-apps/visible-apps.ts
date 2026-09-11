import { sortBy } from 'remeda';

import type { InstalledApp } from '@/shared/lib';

import type { VisibleAppsInput } from './visible-apps.types';

import { matchesQuery } from '../matches-query';
import { withPickedApps } from '../with-picked-apps';

export const visibleApps = ({ apps, picked, query }: VisibleAppsInput): InstalledApp[] => {
  const listed = withPickedApps({ apps, picked });
  const needle = query.trim().toLowerCase();
  const matched = needle ? listed.filter((app) => matchesQuery({ name: app.name, needle })) : listed;

  return sortBy(
    matched,
    (app) => (picked.includes(app.path) ? 0 : 1),
    (app) => (needle && app.name.toLowerCase().includes(needle) ? 0 : 1)
  );
};
