import { clsx } from 'clsx';

import type { LoadingBlockProps } from './LoadingBlock.types';

import { Spinner } from '../../atoms';

import s from './LoadingBlock.module.scss';

export const LoadingBlock = ({ label, className }: LoadingBlockProps) => (
  <div className={clsx(s.root, className)} role='status'>
    <Spinner />
    <span>{label}</span>
  </div>
);
