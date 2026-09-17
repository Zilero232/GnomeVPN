export type XrayClientOptions = {
  baseUrl: string;
  token: string;
};

export type IssueClientInput = {
  email: string;
  auth?: string;
  deferRestart?: boolean;
};

export type IssueVlessClientInput = {
  email: string;
  id?: string;
  deferRestart?: boolean;
};
