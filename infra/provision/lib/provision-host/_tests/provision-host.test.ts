import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { provisionHost } from '../provision-host';

const baseConfig = {
  host: '203.0.113.10',
  sshUser: 'root',
  sshPassword: 'ssh-secret',
  country: 'Germany',
  countryCode: 'DE',
  flagEmoji: '🇩🇪',
  city: 'Frankfurt',
};

const fakeBasePrisma = {
  node: {
    findFirst: vi.fn(async () => null),
    update: vi.fn(async () => ({ id: 'node-id' })),
    create: vi.fn(async () => ({ id: 'node-id' })),
  },
};

let dir: string;
let serverEnvPath: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'gnomevpn-provision-host-'));
  serverEnvPath = join(dir, '.env');
  await writeFile(serverEnvPath, '');
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

const makeFakeSsh = (execResults: Record<string, { stdout: string; exitCode: number }>) => ({
  connect: vi.fn(async () => undefined),
  exec: vi.fn(async (command: string) => {
    const match = Object.entries(execResults).find(([prefix]) => command.startsWith(prefix));
    return match
      ? { stdout: match[1].stdout, stderr: '', exitCode: match[1].exitCode }
      : { stdout: '', stderr: '', exitCode: 0 };
  }),
  putFile: vi.fn(async () => undefined),
  dispose: vi.fn(),
});

const makeFakeUpsertNode = () => vi.fn(async () => ({ id: 'node-id', wasExisting: false }));

describe('provisionHost', () => {
  it('runs the full pipeline and returns a provisioned result when docker is already installed', async () => {
    const fakeSsh = makeFakeSsh({
      'docker --version': { stdout: 'Docker version 27.0.0', exitCode: 0 },
      'command -v ufw': { stdout: '/usr/sbin/ufw', exitCode: 0 },
    });
    const healthCheck = vi.fn(async () => true);
    const upsertNodeFn = makeFakeUpsertNode();

    const result = await provisionHost(baseConfig, {
      serverEnvPath,
      wgEasyComposeContent: 'services:\n  wg-easy:\n    image: ghcr.io/wg-easy/wg-easy:14\n',
      createSshClient: () => fakeSsh as never,
      healthCheck,
      upsertNode: upsertNodeFn,
      basePrisma: fakeBasePrisma as never,
    });

    expect(result).toEqual({ host: '203.0.113.10', country: 'Germany', status: 'provisioned' });
    expect(fakeSsh.connect).toHaveBeenCalledWith({
      host: '203.0.113.10',
      username: 'root',
      password: 'ssh-secret',
    });
    expect(fakeSsh.exec).toHaveBeenCalledWith(expect.stringContaining('docker compose'));
    expect(healthCheck).toHaveBeenCalled();
    expect(upsertNodeFn).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        country: 'Germany',
        countryCode: 'DE',
        publicEndpoint: '203.0.113.10:51820',
        wgEasyUrl: 'http://203.0.113.10:51821',
        wgEasyApiKeyRef: 'WG_KEY_DE',
      }),
    );
    expect(fakeSsh.dispose).toHaveBeenCalled();
  });

  it('loads the kernel modules wg-easy needs before starting the stack', async () => {
    const fakeSsh = makeFakeSsh({
      'docker --version': { stdout: 'Docker version 27.0.0', exitCode: 0 },
      'command -v ufw': { stdout: '/usr/sbin/ufw', exitCode: 0 },
    });

    await provisionHost(baseConfig, {
      serverEnvPath,
      wgEasyComposeContent: 'services: {}',
      createSshClient: () => fakeSsh as never,
      healthCheck: vi.fn(async () => true),
      upsertNode: makeFakeUpsertNode(),
      basePrisma: fakeBasePrisma as never,
    });

    const commands = fakeSsh.exec.mock.calls.map(([command]) => command as string);

    // wg-quick внутри контейнера не может сделать modprobe (/lib/modules не смонтирован),
    // поэтому iptable_nat и wireguard должны быть загружены на хосте.
    expect(commands.some((command) => command.includes('modprobe iptable_nat'))).toBe(true);
    expect(commands.some((command) => command.includes('modprobe wireguard'))).toBe(true);

    // ...и обязательно ДО docker compose up, иначе контейнер уйдёт в краш-луп.
    const modprobeIndex = commands.findIndex((command) => command.includes('modprobe iptable_nat'));
    const composeUpIndex = commands.findIndex((command) => command.includes('docker compose up'));

    expect(modprobeIndex).toBeGreaterThanOrEqual(0);
    expect(composeUpIndex).toBeGreaterThan(modprobeIndex);
  });

  it('installs docker when docker --version fails', async () => {
    const fakeSsh = makeFakeSsh({
      'docker --version': { stdout: '', exitCode: 127 },
      'command -v ufw': { stdout: '/usr/sbin/ufw', exitCode: 0 },
    });
    const upsertNodeFn = makeFakeUpsertNode();

    await provisionHost(baseConfig, {
      serverEnvPath,
      wgEasyComposeContent: 'services: {}',
      createSshClient: () => fakeSsh as never,
      healthCheck: vi.fn(async () => true),
      upsertNode: upsertNodeFn,
      basePrisma: fakeBasePrisma as never,
    });

    expect(fakeSsh.exec).toHaveBeenCalledWith(expect.stringContaining('get.docker.com'));
  });

  it('scopes the firewall rule to backendIp when provided', async () => {
    const fakeSsh = makeFakeSsh({
      'docker --version': { stdout: 'Docker version 27.0.0', exitCode: 0 },
      'command -v ufw': { stdout: '/usr/sbin/ufw', exitCode: 0 },
    });

    await provisionHost(baseConfig, {
      backendIp: '198.51.100.5',
      serverEnvPath,
      wgEasyComposeContent: 'services: {}',
      createSshClient: () => fakeSsh as never,
      healthCheck: vi.fn(async () => true),
      upsertNode: makeFakeUpsertNode(),
      basePrisma: fakeBasePrisma as never,
    });

    expect(fakeSsh.exec).toHaveBeenCalledWith(
      expect.stringMatching(/ufw allow from 198\.51\.100\.5.*51821/),
    );
  });

  it('opens the firewall to all sources with a warning when backendIp is omitted', async () => {
    const fakeSsh = makeFakeSsh({
      'docker --version': { stdout: 'Docker version 27.0.0', exitCode: 0 },
      'command -v ufw': { stdout: '/usr/sbin/ufw', exitCode: 0 },
    });

    await provisionHost(baseConfig, {
      serverEnvPath,
      wgEasyComposeContent: 'services: {}',
      createSshClient: () => fakeSsh as never,
      healthCheck: vi.fn(async () => true),
      upsertNode: makeFakeUpsertNode(),
      basePrisma: fakeBasePrisma as never,
    });

    expect(fakeSsh.exec).toHaveBeenCalledWith(expect.stringMatching(/ufw allow.*51821/));
  });

  it('reuses an existing panel password and does not append a duplicate env line', async () => {
    await writeFile(serverEnvPath, 'WG_KEY_DE=already-there\n');
    const fakeSsh = makeFakeSsh({
      'docker --version': { stdout: 'Docker version 27.0.0', exitCode: 0 },
      'command -v ufw': { stdout: '/usr/sbin/ufw', exitCode: 0 },
    });

    const result = await provisionHost(baseConfig, {
      serverEnvPath,
      wgEasyComposeContent: 'services: {}',
      createSshClient: () => fakeSsh as never,
      healthCheck: vi.fn(async () => true),
      upsertNode: makeFakeUpsertNode(),
      basePrisma: fakeBasePrisma as never,
    });

    expect(result.status).toBe('provisioned');
    const envContent = await import('node:fs/promises').then((fs) =>
      fs.readFile(serverEnvPath, 'utf8'),
    );
    expect(envContent.match(/WG_KEY_DE=/g)).toHaveLength(1);
  });

  it('returns a failed result with the error message when the health check never succeeds', async () => {
    const fakeSsh = makeFakeSsh({
      'docker --version': { stdout: 'Docker version 27.0.0', exitCode: 0 },
      'command -v ufw': { stdout: '/usr/sbin/ufw', exitCode: 0 },
    });

    const result = await provisionHost(baseConfig, {
      serverEnvPath,
      wgEasyComposeContent: 'services: {}',
      createSshClient: () => fakeSsh as never,
      healthCheck: vi.fn(async () => false),
      upsertNode: makeFakeUpsertNode(),
      basePrisma: fakeBasePrisma as never,
      healthCheckTimeoutMs: 50,
      healthCheckIntervalMs: 10,
    });

    expect(result.status).toBe('failed');
    expect(result.error).toMatch(/health check/i);
    expect(fakeSsh.dispose).toHaveBeenCalled();
  });

  it('returns a failed result and still disposes the SSH client when connect throws', async () => {
    const fakeSsh = makeFakeSsh({});
    fakeSsh.connect = vi.fn(async () => {
      throw new Error('ECONNREFUSED');
    });

    const result = await provisionHost(baseConfig, {
      serverEnvPath,
      wgEasyComposeContent: 'services: {}',
      createSshClient: () => fakeSsh as never,
      healthCheck: vi.fn(async () => true),
      upsertNode: makeFakeUpsertNode(),
      basePrisma: fakeBasePrisma as never,
    });

    expect(result.status).toBe('failed');
    expect(result.error).toContain('ECONNREFUSED');
    expect(fakeSsh.dispose).toHaveBeenCalled();
  });
});
