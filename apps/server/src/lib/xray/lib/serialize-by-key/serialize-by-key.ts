const chains = new Map<string, Promise<unknown>>();

export const serializeByKey = <T>(key: string, task: () => Promise<T>): Promise<T> => {
  const previous = chains.get(key) ?? Promise.resolve();
  const next = previous.catch(() => undefined).then(task);

  chains.set(
    key,
    next.finally(() => {
      if (chains.get(key) === next) {
        chains.delete(key);
      }
    }),
  );

  return next;
};
