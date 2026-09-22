import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useHydrated } from '../use-hydrated';

describe('useHydrated', () => {
  it('reports true once React is running in the browser', () => {
    const { result } = renderHook(() => useHydrated());

    expect(result.current).toBe(true);
  });
});
