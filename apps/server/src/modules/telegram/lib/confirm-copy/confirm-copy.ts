import { InlineKeyboard } from 'grammy';

import type { BotText, ConfirmCopy } from '../../telegram.types';
import type { ConfirmKeyboardInput, RemoveDeviceCopyInput } from './confirm-copy.types';

import { CONFIRMED, DECLINED } from '../../config';
import { fillText } from '../fill-text';
import { answerData } from './confirm-copy.helpers';

export const unlinkCopy = (copy: BotText): ConfirmCopy => ({ ask: copy.unlinkAsk, yes: copy.unlinkYes, no: copy.unlinkNo });

export const deleteCopy = (copy: BotText): ConfirmCopy => ({ ask: copy.deleteAsk, yes: copy.deleteYes, no: copy.deleteNo });

export const rotateCopy = (copy: BotText): ConfirmCopy => ({ ask: copy.rotateAsk, yes: copy.rotateYes, no: copy.rotateNo });

export const removeDeviceCopy = ({ copy, name }: RemoveDeviceCopyInput): ConfirmCopy => ({
  ask: fillText({ text: copy.deviceRemoveAsk, fill: { name } }),
  yes: copy.deviceRemoveYes,
  no: copy.deviceRemoveNo
});

export const confirmKeyboard = ({ copy, prefix, subject }: ConfirmKeyboardInput): InlineKeyboard =>
  new InlineKeyboard()
    .text(copy.yes, answerData({ prefix, answer: CONFIRMED, subject }))
    .text(copy.no, answerData({ prefix, answer: DECLINED, subject }));
