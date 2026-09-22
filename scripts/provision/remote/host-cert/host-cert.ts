import type { SshClient } from '@gnomevpn/scripts/ssh';

import { all, arg, dirOf, line, orElse } from '@gnomevpn/scripts/shell';

import { CERT_PATH, KEY_PATH, log, MASQUERADE_HOST } from '../../config';
import { inContainer } from '../xray-stack';

export const ensureCert = async (ssh: SshClient) => {
  const generate = line([
    'openssl req -x509 -nodes -newkey ec',
    '-pkeyopt ec_paramgen_curve:prime256v1',
    `-keyout ${KEY_PATH}`,
    `-out ${CERT_PATH}`,
    `-subj ${arg(`/CN=${MASQUERADE_HOST}`)}`,
    '-days 3650'
  ]);

  log.step('ensuring the node certificate');

  await ssh.exec(inContainer(all([line(['mkdir', '-p', dirOf(CERT_PATH)]), `(${orElse([`test -f ${CERT_PATH}`, generate])})`])));
};

export const readCertFingerprint = async (ssh: SshClient): Promise<string> => {
  const result = await ssh.exec(inContainer(line([`openssl x509 -in ${CERT_PATH}`, '-noout -fingerprint -sha256'])));

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
