export type SshConnectOptions = {
  host: string;
  username: string;
  port?: number;
  password?: string;
  privateKeyPath?: string;
};

export type SshExecResult = {
  stdout: string;
  stderr: string;
  exitCode: number;
};

export type SshScriptInput = {
  cwd: string;
  script: string;
};
