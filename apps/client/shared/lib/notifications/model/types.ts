export type NotifyTone = 'error' | 'info' | 'success';

export type NotifyInput = {
  title: string;
  body: string;
  tone?: NotifyTone;
};
