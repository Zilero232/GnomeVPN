export type GithubFetchInput = {
  url: string;
  headers?: Record<string, string>;
  redirect?: RequestRedirect;
  describe: string;
};
