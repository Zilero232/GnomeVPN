const BOT_ID = /^(\d+):/u;

export const botIdOf = (token: string): string | null => BOT_ID.exec(token)?.[1] ?? null;
