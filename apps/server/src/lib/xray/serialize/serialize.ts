import type { SerializeByKeyInput } from './serialize.types';

const chains = new Map<string, Promise<unknown>>();

export const serializeByKey = <T>({ key, task }: SerializeByKeyInput<T>): Promise<T> => {
  const previous = chains.get(key) ?? Promise.resolve();
  const next = previous.catch(() => undefined).then(task);

  const tail: Promise<unknown> = next
    .catch(() => undefined)
    .finally(() => {
      if (chains.get(key) === tail) {
        chains.delete(key);
      }
    });

  chains.set(key, tail);

  return next;
};

export const pendingChains = (): number => chains.size;
