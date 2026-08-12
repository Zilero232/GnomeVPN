'use client';

import type { ComponentProps } from 'react';

import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { clsx } from 'clsx';
import { X } from 'lucide-react';

import s from './Dialog.module.scss';

export const Dialog = BaseDialog.Root;
export const DialogTrigger = BaseDialog.Trigger;

export const DialogContent = ({ className, children, ...props }: ComponentProps<typeof BaseDialog.Popup>) => (
  <BaseDialog.Portal>
    <BaseDialog.Backdrop className={s.overlay} />

    <BaseDialog.Popup className={clsx(s.content, className)} {...props}>
      {children}

      <BaseDialog.Close aria-label='Close' className={s.close}>
        <X size={15} />
      </BaseDialog.Close>
    </BaseDialog.Popup>
  </BaseDialog.Portal>
);

export const DialogHeader = ({ className, ...props }: ComponentProps<'div'>) => <div className={clsx(s.header, className)} {...props} />;

export const DialogTitle = ({ className, ...props }: ComponentProps<typeof BaseDialog.Title>) => (
  <BaseDialog.Title className={clsx(s.title, className)} {...props} />
);

export const DialogDescription = ({ className, ...props }: ComponentProps<typeof BaseDialog.Description>) => (
  <BaseDialog.Description className={clsx(s.description, className)} {...props} />
);
