import { all, dockerShell, line } from '@gnomevpn/scripts/shell';

import type { ShipStackInput } from './xray-stack.types';

import { log } from '../../config';
import { CONTAINER_NAME, XRAY_STACK } from './xray-stack.constants';

export const inContainer = (script: string) => dockerShell({ container: CONTAINER_NAME, script });

export const shipStack = async ({ ssh, composeContent }: ShipStackInput) => {
  log.step(`shipping the xray stack to ${XRAY_STACK.remoteDir}`);

  await ssh.run(line(['mkdir', '-p', XRAY_STACK.remoteDir]));
  await ssh.putFile({ content: composeContent, remotePath: XRAY_STACK.composeFile });
  await ssh.run(all([line(['cd', XRAY_STACK.remoteDir]), 'docker compose up -d']));

  log.done('the xray stack is up');
};
