import type { SerializeByKeyInput } from './serialize.types';

const chains = new Map<string, Promise<unknown>>();

export const serializeByKey = <T>({ key, task }: SerializeByKeyInput<T>): Promise<T> => {
  const previous = chains.get(key) ?? Promise.resolve();
  const next = previous.catch(() => undefined).then(task);

  chains.set(
    key,
    next
      .catch(() => undefined)
      .finally(() => {
        if (chains.get(key) === next) {
          chains.delete(key);
        }
      })
  );

  return next;
};
