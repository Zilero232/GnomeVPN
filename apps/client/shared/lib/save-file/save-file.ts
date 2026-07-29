import { saveAs } from 'file-saver';

import type { SaveFileInput, SaveFileResult } from './save-file.types';

import { isTauriMobile } from '../tauri-platform';
import { shareConfigFile } from '../vpn-bridge';

const shareOnMobile = async ({ blob, fileName }: SaveFileInput): Promise<boolean> =>
  shareConfigFile({ fileName, content: (await blob.text()).trim() });

export const saveFile = async (input: SaveFileInput): Promise<SaveFileResult> => {
  if (isTauriMobile() && (await shareOnMobile(input))) {
    return { target: 'shared', fileName: input.fileName };
  }

  saveAs(input.blob, input.fileName);

  return { target: 'browser', fileName: input.fileName };
};
