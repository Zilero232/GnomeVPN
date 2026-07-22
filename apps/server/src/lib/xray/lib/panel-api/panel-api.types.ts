export type PanelApiInput = {
  baseUrl: string;
  token: string;
  timeout: number;
};

export type PanelRequestConfig = {
  method?: string;
  data?: unknown;
};

export type PanelInterceptors = {
  interceptors: {
    request: {
      use: (onFulfilled: (config: PanelRequestConfig) => PanelRequestConfig) => void;
    };
  };
};
