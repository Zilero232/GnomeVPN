export type SaveFileInput = {
  blob: Blob;
  fileName: string;
};

export type SaveFileResult = {
  target: 'downloads' | 'browser';
  fileName: string;
};
