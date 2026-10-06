import { isNullish } from 'remeda';

import type { AnswerDataInput } from './confirm-copy.types';

import { SUBJECT_SEPARATOR } from '../../config';

export const answerData = ({ prefix, answer, subject }: AnswerDataInput): string =>
  isNullish(subject) ? `${prefix}${answer}` : `${prefix}${answer}${SUBJECT_SEPARATOR}${subject}`;
