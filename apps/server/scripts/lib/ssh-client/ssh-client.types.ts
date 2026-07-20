export type SshConnectOptions = {
  host: string;
  username: string;
  password: string;
};

export type SshExecResult = {
  stdout: string;
  stderr: string;
  exitCode: number;
};
