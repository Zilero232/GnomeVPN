export const stripCidrMask = (address: string): string => address.replace(/\/\d+$/, '');
