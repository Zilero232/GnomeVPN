const INCY_USER_AGENT = /^INCY\/([^/\s]+)\/([^/\s]+)/i;

export const clientPlatform = (userAgent: string | null): string | null => {
  if (!userAgent) {
    return null;
  }

  const match = INCY_USER_AGENT.exec(userAgent.trim());

  if (!match) {
    return userAgent.slice(0, 64);
  }

  return `INCY ${match[2]} ${match[1]}`;
};
