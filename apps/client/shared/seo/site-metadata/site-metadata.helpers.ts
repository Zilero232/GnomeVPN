import { SITE } from '@/shared/config';

export const absoluteUrl = (path: string): string => new URL(path, SITE.url).toString();
