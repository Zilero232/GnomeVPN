'use client';

import { Check, Loader2, Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { sortBy } from 'remeda';
import { toast } from 'sonner';

import { MAX_SPLIT_APPS } from '@/shared/constants';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
} from '@/shared/ui';
import { matchesQuery } from '../../lib';

import s from './SplitTunnelingDialog.module.scss';

import type { SplitTunnelingDialogProps } from './SplitTunnelingDialog.types';

export const SplitTunnelingDialog = ({
  isConnected,
  isOpen,
  splitTunneling,
  onOpenChange,
}: SplitTunnelingDialogProps) => {
  const t = useTranslations('splitTunneling');
  const { apps, isLoading, isApplying, isDirty, isFull, selected, toggle, clear, apply } =
    splitTunneling;
  const [query, setQuery] = useState('');

  const needle = query.trim().toLowerCase();
  const matched = needle ? apps.filter((app) => matchesQuery({ name: app.name, needle })) : apps;
  const visible = sortBy(
    matched,
    (app) => (selected.includes(app.path) ? 0 : 1),
    (app) => (needle && app.name.toLowerCase().includes(needle) ? 0 : 1),
  );

  const submit = async () => {
    if (await apply()) {
      onOpenChange(false);

      return;
    }

    toast.error(t('applyFailed'));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={s.dialog}>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        <div className={s.search}>
          <Search className={s.searchIcon} size={15} />

          <Input
            placeholder={t('searchPlaceholder')}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />

          {query && (
            <button
              aria-label={t('clearSearch')}
              className={s.searchClear}
              type="button"
              onClick={() => setQuery('')}
            >
              <X size={13} />
            </button>
          )}
        </div>

        <div className={s.list}>
          {isLoading && <p className={s.state}>{t('loading')}</p>}

          {!isLoading && visible.length === 0 && <p className={s.state}>{t('empty')}</p>}

          {visible.map((app) => {
            const isSelected = selected.includes(app.path);

            return (
              <button
                className={s.row}
                data-selected={isSelected}
                key={app.path}
                type="button"
                onClick={() => toggle(app.path)}
              >
                <span aria-hidden className={s.glyph}>
                  {app.name.charAt(0).toUpperCase()}
                </span>

                <span className={s.info}>
                  <span className={s.name}>{app.name}</span>
                  <span className={s.path}>{app.path}</span>
                </span>

                <span className={s.box}>{isSelected && <Check size={12} strokeWidth={3} />}</span>
              </button>
            );
          })}
        </div>

        <div className={s.summary}>
          <span className={s.count} data-active={selected.length > 0}>
            {selected.length === 0
              ? t('allTraffic')
              : t('selectedCount', { count: selected.length })}
          </span>

          <button
            className={s.clear}
            disabled={selected.length === 0 || isApplying}
            type="button"
            onClick={clear}
          >
            {t('clear')}
          </button>
        </div>

        {isFull && <p className={s.warning}>{t('limitReached', { count: MAX_SPLIT_APPS })}</p>}

        {isDirty && isConnected && <p className={s.warning}>{t('reconnectWarning')}</p>}

        <div className={s.footer}>
          <Button
            disabled={isApplying}
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            {t('cancel')}
          </Button>

          <Button disabled={!isDirty || isApplying} type="button" onClick={submit}>
            {isApplying && <Loader2 className={s.spinner} size={14} />}
            {isApplying ? t('applying') : t('apply')}
          </Button>
        </div>

        <p className={s.note}>{t('note')}</p>
      </DialogContent>
    </Dialog>
  );
};
