import { NodeSSH } from 'node-ssh';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import pRetry from 'p-retry';

import type { SshConnectOptions, SshExecResult } from './ssh-client.types';

import { CONNECT_ATTEMPTS, CONNECT_BACKOFF_MS, READY_TIMEOUT_MS } from './ssh-client.constants';

export class SshClient {
  private readonly ssh = new NodeSSH();

  async connect(opts: SshConnectOptions): Promise<void> {
    await pRetry(
      () =>
        this.ssh.connect({
          host: opts.host,
          username: opts.username,
          ...(opts.privateKeyPath
            ? { privateKeyPath: opts.privateKeyPath }
            : { password: opts.password }),
          readyTimeout: READY_TIMEOUT_MS
        }),
      { retries: CONNECT_ATTEMPTS, minTimeout: CONNECT_BACKOFF_MS }
    );
  }

  async exec(command: string): Promise<SshExecResult> {
    const result = await this.ssh.execCommand(command);

    return { stdout: result.stdout, stderr: result.stderr, exitCode: result.code ?? 0 };
  }

  async putFile(localContent: string, remotePath: string): Promise<void> {
    const dir = await mkdtemp(join(tmpdir(), 'gnomevpn-ssh-put-'));
    const localPath = join(dir, 'payload');

    try {
      await writeFile(localPath, localContent, 'utf8');
      await this.ssh.putFile(localPath, remotePath);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }

  dispose(): void {
    this.ssh.dispose();
  }
}
