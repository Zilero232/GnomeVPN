import { intervalToDuration } from 'date-fns';

const pad = (value = 0) => String(value).padStart(2, '0');

export const formatUptime = (from: Date): string => {
  const { days, hours, minutes, seconds } = intervalToDuration({ start: from, end: new Date() });

  return `${pad((days ?? 0) * 24 + (hours ?? 0))}:${pad(minutes)}:${pad(seconds)}`;
};
