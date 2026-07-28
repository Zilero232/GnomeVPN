export const unwrapAuth = <T>(result: { data: T; error: unknown }, errorKey: string): T => {
  if (result.error) {
    throw new Error(errorKey);
  }

  return result.data;
};
