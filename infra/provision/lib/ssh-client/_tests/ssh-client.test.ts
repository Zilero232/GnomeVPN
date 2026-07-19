import { afterEach, describe, expect, it, vi } from 'vitest';

import { SshClient } from '../ssh-client';

vi.mock('node-ssh', () => {
  const connect = vi.fn(async () => undefined);
  const execCommand = vi.fn(async () => ({ stdout: 'ok', stderr: '', code: 0 }));
  const putFile = vi.fn(async () => undefined);
  const dispose = vi.fn();

  return {
    NodeSSH: vi.fn().mockImplementation(function NodeSSH() {
      return { connect, execCommand, putFile, dispose };
    }),
  };
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('SshClient', () => {
  it('connects with the given credentials', async () => {
    const { NodeSSH } = await import('node-ssh');
    const client = new SshClient();

    await client.connect({ host: '203.0.113.10', username: 'root', password: 'secret' });

    const instance = vi.mocked(NodeSSH).mock.results[0].value;
    expect(instance.connect).toHaveBeenCalledWith({
      host: '203.0.113.10',
      username: 'root',
      password: 'secret',
    });
  });

  it('runs a command and normalizes the result shape', async () => {
    const client = new SshClient();
    await client.connect({ host: '203.0.113.10', username: 'root', password: 'secret' });

    const result = await client.exec('docker --version');

    expect(result).toEqual({ stdout: 'ok', stderr: '', exitCode: 0 });
  });

  it('disposes the underlying connection', async () => {
    const { NodeSSH } = await import('node-ssh');
    const client = new SshClient();
    await client.connect({ host: '203.0.113.10', username: 'root', password: 'secret' });

    client.dispose();

    const instance = vi.mocked(NodeSSH).mock.results[0].value;
    expect(instance.dispose).toHaveBeenCalled();
  });
});
