export type NodeCredentials = {
  password: string;
  panelPath: string;
};

export type ResolveNodeCredentialsInput = {
  envFilePath: string;
  countryCode: string;
};
