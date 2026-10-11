export type ApiPayload = Record<string, unknown>;

export type ApiFailure = {
  error_code: number;
  description: string;
};

export type Repair = (payload: ApiPayload) => ApiPayload;
