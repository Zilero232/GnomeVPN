import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';

import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';

declare module 'vitest' {
  // eslint-disable-next-line ts/consistent-type-definitions -- declaration merging onto vitest's Matchers needs an interface
  interface Matchers<R extends Promise<void> | void = Promise<void> | void, T = unknown> extends TestingLibraryMatchers<T, R> {}
}

afterEach(() => {
  cleanup();
});

vi.mock('next/font/local', () => ({
  default: () => ({ className: 'font-mock', variable: 'font-mock-variable', style: { fontFamily: 'mock' } })
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn()
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams()
}));
