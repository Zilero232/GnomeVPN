# Folders

Part of the [style guide](../README.md).

## Folders are one concern, not one function

**A folder is one concern, not one function.** Each gets its own `index.ts`,
`<name>.types.ts` and `<name>.constants.ts` where it needs them, so a reader
opens `vless/` and finds every VLESS thing and nothing else.

The unit is the concern because the alternative was tried: `lib/xray` once held
seven folders and fifteen files for a handful of lines — `strip-cidr-mask/` was a
single regex behind its own barrel, `generate-auth/` a single `randomBytes` call.
Reaching either meant `lib/xray/lib/<name>/<name>.ts`, three levels of
indirection to arrive at one statement. A helper too small to have its own types
belongs in the `<name>.helpers.ts` of the concern that uses it.
