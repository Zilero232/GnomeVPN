'use client';

import { clsx } from 'clsx';
import { useState } from 'react';

import { useNodes } from '@/entities/vpn/node';
import { ConnectButton, useVpnConnection } from '@/features/vpn/connect';

import s from './AppView.module.scss';

export const AppView = () => {
  const { nodes, isLoading, isError } = useNodes();
  const { status, activeNodeId, connect, disconnect } = useVpnConnection();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const effectiveNodeId = activeNodeId ?? selectedNodeId ?? nodes[0]?.id ?? null;

  const onToggle = () => {
    if (status === 'connected') {
      void disconnect();
      return;
    }

    if (effectiveNodeId) {
      void connect(effectiveNodeId);
    }
  };

  return (
    <main className={s.root}>
      <h1 className={s.title}>Vesper</h1>

      <ConnectButton status={status} disabled={!effectiveNodeId} onToggle={onToggle} />

      <section className={s.nodes}>
        {isLoading && <p className={s.hint}>Загрузка стран…</p>}
        {!isLoading && isError && <p className={s.hint}>Не удалось загрузить список стран</p>}
        {!isLoading && !isError && nodes.length === 0 && (
          <p className={s.hint}>Нет доступных стран</p>
        )}
        {nodes.map((node) => (
          <button
            key={node.id}
            className={clsx(s.node, effectiveNodeId === node.id && s.nodeActive)}
            disabled={status !== 'disconnected'}
            type="button"
            onClick={() => setSelectedNodeId(node.id)}
          >
            <span className={s.flag}>{node.flagEmoji}</span>
            <span>{node.country}</span>
          </button>
        ))}
      </section>
    </main>
  );
};
