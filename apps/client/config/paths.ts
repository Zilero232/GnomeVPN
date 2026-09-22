import path from 'node:path';

export const CLIENT_ROOT = path.resolve(import.meta.dirname, '..');

export const REPO_ROOT = path.resolve(CLIENT_ROOT, '..', '..');
