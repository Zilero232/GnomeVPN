export const PROTOCOL_IDS = ['hysteria2', 'vless'] as const;

export const PROTOCOL_ROWS = ['transport', 'port', 'lossBehaviour', 'blocking', 'bestFor'] as const;

export const SERVER_SECTIONS = ['whyTwo', 'whichToPick', 'howMany', 'addingMore'] as const;

export type ProtocolId = (typeof PROTOCOL_IDS)[number];
