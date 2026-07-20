import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { NodeSSH } from 'node-ssh';

import type { SshConnectOptions, SshExecResult } from './ssh-client.types';

export class SshClient {
  private readonly ssh = new NodeSSH();

  async connect(opts: SshConnectOptions): Promise<void> {
    await this.ssh.connect({ host: opts.host, username: opts.username, password: opts.password });
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
