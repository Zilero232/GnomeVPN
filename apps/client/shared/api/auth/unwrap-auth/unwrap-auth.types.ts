export type AuthResult<T> = {
  data: T;
  error: { code?: string; message?: string; status?: number } | null;
};
