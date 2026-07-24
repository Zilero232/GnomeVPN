import type { MatchesQueryInput } from './matches-query.types';

export const matchesQuery = ({ name, needle }: MatchesQueryInput): boolean => {
  const haystack = name.toLowerCase();

  if (haystack.includes(needle)) {
    return true;
  }

  let cursor = 0;

  for (const letter of needle) {
    cursor = haystack.indexOf(letter, cursor);

    if (cursor === -1) {
      return false;
    }

    cursor += 1;
  }

  return true;
};
