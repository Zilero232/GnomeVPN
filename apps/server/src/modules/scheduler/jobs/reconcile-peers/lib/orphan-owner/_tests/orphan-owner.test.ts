import { describe, expect, it } from 'vitest';

import { PEER_PREFIX, peerClientName } from '../../../../../../peers';
import { ownerIdOf } from '../orphan-owner';

const USER_ID = 'nZTp8U6AtElvrC60yGPq6GBfwLL9kxbX';

describe('ownerIdOf', () => {
  it('reads the owner back out of a name the peer module built', () => {
    const email = peerClientName({ kind: 'config', name: 'incy', nodeId: 'node-1', protocol: 'vless', userId: USER_ID });

    expect(ownerIdOf(email)).toBe(USER_ID);
  });

  it('reads the owner of a session peer whose device name is empty', () => {
    const email = peerClientName({ kind: 'session', name: null, nodeId: 'node-1', protocol: 'hysteria2', userId: USER_ID });

    expect(ownerIdOf(email)).toBe(USER_ID);
  });

  it('accepts every prefix the peer module can produce', () => {
    for (const prefix of Object.values(PEER_PREFIX)) {
      expect(ownerIdOf(`${prefix}${USER_ID}-rest`)).toBe(USER_ID);
    }
  });

  it('refuses a client this server never named', () => {
    expect(ownerIdOf('some-other-tool-client')).toBeNull();
  });

  it('refuses a name whose owner segment is not an id, rather than deleting someone', () => {
    expect(ownerIdOf(`${PEER_PREFIX.config}short-incy-node-1`)).toBeNull();
  });
});
