import type { BotText, ConfirmCopy } from '../../telegram.types';

export const unlinkCopy = (copy: BotText): ConfirmCopy => ({ ask: copy.unlinkAsk, yes: copy.unlinkYes, no: copy.unlinkNo });

export const deleteCopy = (copy: BotText): ConfirmCopy => ({ ask: copy.deleteAsk, yes: copy.deleteYes, no: copy.deleteNo });

export const rotateCopy = (copy: BotText): ConfirmCopy => ({ ask: copy.rotateAsk, yes: copy.rotateYes, no: copy.rotateNo });
