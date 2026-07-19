'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { clsx } from 'clsx';
import { X } from 'lucide-react';

import s from './Dialog.module.scss';

import type { ComponentProps } from 'react';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;

export const DialogContent = ({
  className,
  children,
  ...props
}: ComponentProps<typeof DialogPrimitive.Content>) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className={s.overlay} />
    <DialogPrimitive.Content className={clsx(s.content, className)} {...props}>
      {children}
      <DialogPrimitive.Close aria-label="Close" className={s.close}>
        <X size={15} />
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
);

export const DialogHeader = ({ className, ...props }: ComponentProps<'div'>) => (
  <div className={clsx(s.header, className)} {...props} />
);

export const DialogTitle = ({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Title>) => (
  <DialogPrimitive.Title className={clsx(s.title, className)} {...props} />
);

export const DialogDescription = ({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Description>) => (
  <DialogPrimitive.Description className={clsx(s.description, className)} {...props} />
);
