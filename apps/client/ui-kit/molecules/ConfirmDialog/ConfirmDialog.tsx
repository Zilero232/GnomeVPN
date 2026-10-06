'use client';

import { clsx } from 'clsx';

import type { ConfirmDialogProps } from './ConfirmDialog.types';

import { Button } from '../../atoms';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../Dialog';
import { SubmitButton } from '../SubmitButton';

import s from './ConfirmDialog.module.scss';

export const ConfirmDialog = ({
  isOpen,
  isPending,
  title,
  description,
  confirmLabel,
  cancelLabel,
  tone = 'danger',
  className,
  onOpenChange,
  onConfirm
}: ConfirmDialogProps) => (
  <Dialog open={isOpen} onOpenChange={onOpenChange}>
    <DialogContent className={clsx(s.content, className)}>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>

      <div className={s.actions}>
        <Button disabled={isPending} variant='ghost' onClick={() => onOpenChange(false)}>
          {cancelLabel}
        </Button>

        <SubmitButton isPending={isPending} size='md' type='button' variant={tone} onClick={onConfirm}>
          {confirmLabel}
        </SubmitButton>
      </div>
    </DialogContent>
  </Dialog>
);
