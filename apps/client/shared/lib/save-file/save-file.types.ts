export type SaveFileInput = {
  blob: Blob;
  fileName: string;
};

export type SaveFileResult = {
  target: 'browser' | 'shared';
  fileName: string;
};
