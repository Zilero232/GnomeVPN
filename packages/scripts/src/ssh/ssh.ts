import { NodeSSH } from 'node-ssh';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import pRetry from 'p-retry';

import type { SshConnectOptions, SshExecResult, SshPutFileInput } from './ssh.types';

import { SIGNALLED_EXIT_CODE, SSH_CONNECT, SSH_UPLOAD } from './ssh.constants';
import { failureOf } from './ssh.helpers';

export class SshClient {
  private readonly ssh = new NodeSSH();

  async connect(opts: SshConnectOptions) {
    await pRetry(
      () =>
        this.ssh.connect({
          host: opts.host,
          username: opts.username,
          ...(opts.port && { port: opts.port }),
          ...(opts.privateKeyPath ? { privateKeyPath: opts.privateKeyPath } : { password: opts.password }),
          readyTimeout: SSH_CONNECT.readyTimeoutMs
        }),
      { retries: SSH_CONNECT.retries, minTimeout: SSH_CONNECT.minBackoffMs }
    );
  }

  async exec(command: string): Promise<SshExecResult> {
    const result = await this.ssh.execCommand(command);

    return { stdout: result.stdout, stderr: result.stderr, exitCode: result.code ?? SIGNALLED_EXIT_CODE };
  }

  async run(command: string): Promise<SshExecResult> {
    const result = await this.exec(command);

    if (result.exitCode !== 0) {
      throw new Error(failureOf(result));
    }

    return result;
  }

  async putFile({ content, remotePath }: SshPutFileInput) {
    const dir = await mkdtemp(join(tmpdir(), SSH_UPLOAD.tempPrefix));
    const localPath = join(dir, SSH_UPLOAD.payloadName);

    try {
      await writeFile(localPath, content, 'utf8');
      await this.ssh.putFile(localPath, remotePath);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }

  dispose(): void {
    this.ssh.dispose();
  }
}
