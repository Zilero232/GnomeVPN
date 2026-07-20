'use client';

import { useEffect, useState } from 'react';

import { useUpdateCheck } from '../model/hooks';
import { UpdateDialog } from './components';

export const UpdateGate = () => {
  const { data: update } = useUpdateCheck();
  const [dismissedVersion, setDismissedVersion] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (update && update.version !== dismissedVersion) {
      setIsOpen(true);
    }
  }, [update, dismissedVersion]);

  if (!update) {
    return null;
  }

  const onOpenChange = (open: boolean) => {
    setIsOpen(open);

    if (!open) {
      setDismissedVersion(update.version);
    }
  };

  return <UpdateDialog isOpen={isOpen} update={update} onOpenChange={onOpenChange} />;
};
