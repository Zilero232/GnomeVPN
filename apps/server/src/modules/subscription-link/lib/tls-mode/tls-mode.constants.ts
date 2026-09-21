export const TLS_MODE = {
  pin: 'pin',
  skipVerify: 'skipVerify'
} as const;

// Every client here is built on sing-box, which has no pinSHA256 support at
// all: it ignores the pin and then refuses the node's self-signed certificate.
// Xray-based clients are the opposite — they removed allowInsecure and refuse
// to start when it appears, so the two cannot be served the same URI.
export const SING_BOX_AGENTS = [/hiddify/i, /sing-?box/i, /karing/i, /nekobox/i, /nekoray/i, /clash/i, /stash/i, /streisand/i, /shadowrocket/i];
