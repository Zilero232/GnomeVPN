const METACHARACTERS = /[$()*+.?[\\\]^{|}-]/gu;

const escapeRegExp = (value: string): string => value.replaceAll(METACHARACTERS, String.raw`\$&`);

export const callbackPattern = (prefix: string): RegExp => new RegExp(`^${escapeRegExp(prefix)}`, 'u');
