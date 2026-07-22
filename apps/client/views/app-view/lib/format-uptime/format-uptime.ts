import { intervalToDuration } from 'date-fns';

const pad = (value = 0) => String(value).padStart(2, '0');

// `intervalToDuration` leaves a field undefined when it is zero, and
// `formatDuration` renders prose rather than a clock, so the padding is done
// here.
export const formatUptime = (from: Date): string => {
  const { hours, minutes, seconds } = intervalToDuration({ start: from, end: new Date() });

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};
