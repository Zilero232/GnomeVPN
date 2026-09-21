import { timingSafeEqual as nodeTimingSafeEqual } from 'node:crypto';

export const timingSafeEqual = (left: string, right: string): boolean => {
  const a = Buffer.from(left);
  const b = Buffer.from(right);

  if (a.length !== b.length) {
    return false;
  }

  return nodeTimingSafeEqual(a, b);
};
