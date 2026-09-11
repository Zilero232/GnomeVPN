const pad = (value: number) => String(value).padStart(2, '0');

const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;
const HOUR_MS = 60 * MINUTE_MS;

export const formatUptime = (from: Date): string => {
  const elapsed = Math.max(0, Date.now() - from.getTime());

  const hours = Math.floor(elapsed / HOUR_MS);
  const minutes = Math.floor((elapsed % HOUR_MS) / MINUTE_MS);
  const seconds = Math.floor((elapsed % MINUTE_MS) / SECOND_MS);

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};
