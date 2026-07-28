export type SaveFileInput = {
  blob: Blob;
  fileName: string;
};

export type SaveFileResult = {
  target: 'shared' | 'browser';
  fileName: string;
};
