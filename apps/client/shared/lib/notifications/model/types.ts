export type NotifyTone = 'info' | 'success' | 'error';

export type NotifyInput = {
  title: string;
  body: string;
  tone?: NotifyTone;
};
