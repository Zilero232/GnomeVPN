import { BaseDirectory, mkdir, writeFile } from '@tauri-apps/plugin-fs';
import { saveAs } from 'file-saver';

import { logger } from '../logger';
import { isTauriMobile } from '../tauri-platform';

import type { SaveFileInput, SaveFileResult } from './save-file.types';

const saveToDownloads = async ({ blob, fileName }: SaveFileInput): Promise<boolean> => {
  try {
    await mkdir('', { baseDir: BaseDirectory.Download, recursive: true });
    const bytes = new Uint8Array(await blob.arrayBuffer());
    await writeFile(fileName, bytes, { baseDir: BaseDirectory.Download });

    return true;
  } catch (error) {
    logger.warn(`saveToDownloads failed: ${String(error)}`);

    return false;
  }
};

export const saveFile = async (input: SaveFileInput): Promise<SaveFileResult> => {
  if (isTauriMobile() && (await saveToDownloads(input))) {
    return { target: 'downloads', fileName: input.fileName };
  }

  saveAs(input.blob, input.fileName);

  return { target: 'browser', fileName: input.fileName };
};
