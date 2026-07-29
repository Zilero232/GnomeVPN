import { useEffect, useRef, useState } from 'react';

import type { UseSpeedInput, UseSpeedResult } from './use-speed.types';

const EMPTY: UseSpeedResult = { rx: 0, tx: 0 };

export const useSpeed = ({ rx, tx }: UseSpeedInput): UseSpeedResult => {
  const previous = useRef<{ rx: number; tx: number; at: number } | null>(null);
  const [speed, setSpeed] = useState<UseSpeedResult>(EMPTY);

  useEffect(() => {
    const now = Date.now();
    const last = previous.current;

    previous.current = { rx, tx, at: now };

    if (!last) {
      return;
    }

    const seconds = (now - last.at) / 1000;

    if (seconds <= 0) {
      return;
    }

    setSpeed({
      rx: Math.max(0, (rx - last.rx) / seconds),
      tx: Math.max(0, (tx - last.tx) / seconds)
    });
  }, [rx, tx]);

  return speed;
};
