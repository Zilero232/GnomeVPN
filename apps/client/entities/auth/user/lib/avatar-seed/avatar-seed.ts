const FNV_OFFSET = 2_166_136_261;
const FNV_PRIME = 16_777_619;
const HEX = 16;

export const avatarSeed = (email: string): string => {
  let hash = FNV_OFFSET;

  for (const char of email.trim().toLowerCase()) {
    hash = Math.imul(hash ^ (char.codePointAt(0) ?? 0), FNV_PRIME);
  }

  return (hash >>> 0).toString(HEX);
};
