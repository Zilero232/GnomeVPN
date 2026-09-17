export type AuthResult<T> = {
  data: T;
  error: { code?: string; message?: string; status?: number } | null;
};

export type UnwrapAuthInput<T> = {
  result: AuthResult<T>;
  fallbackKey: string;
};
