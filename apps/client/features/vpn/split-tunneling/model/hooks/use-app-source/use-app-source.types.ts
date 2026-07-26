export type AppSource = 'installed' | 'running';

export type UseAppSourceInput = {
  source: AppSource;
  isOpen: boolean;
};
