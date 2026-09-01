'use client';

import { Check, FolderPlus, Plus, Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { isEmpty, sortBy } from 'remeda';

import { IconButton, Input } from '@/shared/ui';

import type { AppSectionProps } from './AppSection.types';

import { matchesQuery, withPickedApps } from '../../../../lib';
import { useAppSource } from '../../../../model/hooks';
import { SplitModeToggle } from '../SplitModeToggle';

import s from './AppSection.module.scss';

type AppSource = 'installed' | 'running';

export const AppSection = ({ isOpen, draft, setAppsMode, toggleApp, onPick }: AppSectionProps) => {
  const t = useTranslations('splitTunneling');

  const [source, setSource] = useState<AppSource>('installed');
  const [query, setQuery] = useState('');

  const { apps, isLoading } = useAppSource({ source, isOpen });

  const listed = withPickedApps({ apps, picked: draft.apps });

  const needle = query.trim().toLowerCase();
  const matched = needle ? listed.filter((app) => matchesQuery({ name: app.name, needle })) : listed;
  const visible = sortBy(
    matched,
    (app) => (draft.apps.includes(app.path) ? 0 : 1),
    (app) => (needle && app.name.toLowerCase().includes(needle) ? 0 : 1)
  );

  return (
    <div className={s.section}>
      <SplitModeToggle label={t('modeLabel')} lead={t('modeLeadApps')} mode={draft.appsMode} onModeChange={setAppsMode} />

      <div className={s.searchRow}>
        <div className={s.search}>
          <Search aria-hidden className={s.searchIcon} size={15} />

          <Input
            aria-label={t('searchPlaceholder')}
            placeholder={t('searchPlaceholder')}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />

          {query && (
            <IconButton aria-label={t('clearSearch')} className={s.searchClear} size='sm' onClick={() => setQuery('')}>
              <X size={13} />
            </IconButton>
          )}
        </div>

        <button className={s.browse} type='button' onClick={onPick}>
          <FolderPlus aria-hidden size={15} />
          <span>{t('addManually')}</span>
        </button>
      </div>

      <div className={s.sourceRow}>
        <button
          aria-pressed={source === 'installed'}
          className={s.sourceLink}
          data-active={source === 'installed'}
          type='button'
          onClick={() => setSource('installed')}
        >
          {t('sourceInstalled')}
        </button>

        <span aria-hidden className={s.sourceSep}>
          /
        </span>

        <button
          aria-pressed={source === 'running'}
          className={s.sourceLink}
          data-active={source === 'running'}
          type='button'
          onClick={() => setSource('running')}
        >
          {t('sourceRunning')}
        </button>
      </div>

      <div className={s.list}>
        {isLoading && <p className={s.state}>{t('loading')}</p>}

        {!isLoading && isEmpty(visible) && <p className={s.state}>{t('empty')}</p>}

        {!isLoading &&
          visible.map((app) => {
            const isSelected = draft.apps.includes(app.path);

            return (
              <button
                key={app.path}
                aria-pressed={isSelected}
                className={s.row}
                data-mode={isSelected ? draft.appsMode : undefined}
                data-selected={isSelected || undefined}
                type='button'
                onClick={() => toggleApp(app.path)}
              >
                <span aria-hidden className={s.rail} />

                <span aria-hidden className={s.monogram} data-mode={isSelected ? draft.appsMode : undefined}>
                  {app.name.charAt(0).toUpperCase()}
                </span>

                <span className={s.info}>
                  <span className={s.name}>{app.name}</span>
                  <span className={s.path}>{app.path}</span>
                </span>

                <span aria-hidden className={s.mark} data-mode={isSelected ? draft.appsMode : undefined}>
                  {isSelected ? <Check size={13} strokeWidth={2.75} /> : <Plus className={s.markAdd} size={14} strokeWidth={2.5} />}
                </span>
              </button>
            );
          })}
      </div>
    </div>
  );
};
