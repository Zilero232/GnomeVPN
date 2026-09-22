import { all, dockerShell, line } from '@gnomevpn/scripts/shell';

import type { ShipStackInput } from './xray-stack.types';

import { log } from '../../config';
import { CONTAINER_NAME, REMOTE_DIR } from './xray-stack.constants';

export const inContainer = (script: string) => dockerShell({ container: CONTAINER_NAME, script });

export const shipStack = async ({ ssh, composeContent }: ShipStackInput) => {
  log.step(`shipping the xray stack to ${REMOTE_DIR}`);

  await ssh.exec(line(['mkdir', '-p', REMOTE_DIR]));
  await ssh.putFile(composeContent, `${REMOTE_DIR}/docker-compose.yml`);
  await ssh.exec(all([line(['cd', REMOTE_DIR]), 'docker compose up -d']));

  log.done('the xray stack is up');
};
