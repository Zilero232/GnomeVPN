import type { SshClient } from '@gnomevpn/scripts/ssh';

import { all, arg, dirOf, line, orElse } from '@gnomevpn/scripts/shell';

import { log, MASQUERADE_HOST, NODE_FILES } from '../../config';
import { inContainer } from '../xray-stack';

export const ensureCert = async (ssh: SshClient) => {
  const generate = line([
    'openssl req -x509 -nodes -newkey ec',
    '-pkeyopt ec_paramgen_curve:prime256v1',
    `-keyout ${NODE_FILES.key}`,
    `-out ${NODE_FILES.cert}`,
    `-subj ${arg(`/CN=${MASQUERADE_HOST}`)}`,
    '-days 3650'
  ]);

  log.step('ensuring the node certificate');

  await ssh.run(
    inContainer(
      all([
        line(['mkdir', '-p', dirOf(NODE_FILES.cert)]),
        `(${orElse([all([`test -s ${NODE_FILES.cert}`, `test -s ${NODE_FILES.key}`]), generate])})`
      ])
    )
  );
};

export const readCertFingerprint = async (ssh: SshClient): Promise<string> => {
  const result = await ssh.exec(inContainer(line([`openssl x509 -in ${NODE_FILES.cert}`, '-noout -fingerprint -sha256'])));

  if (result.exitCode !== 0) {
    throw new Error(`cannot read the node certificate fingerprint: ${result.stderr.trim() || 'no output'}`);
  }

  const fingerprint = result.stdout.trim().split('=')[1];

  if (!fingerprint) {
    throw new Error('the node returned no certificate fingerprint');
  }

  log.done(`certificate pinned as ${fingerprint.slice(0, 17)}…`);

  return fingerprint;
};
