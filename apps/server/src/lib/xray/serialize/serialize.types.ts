export type SerializeByKeyInput<T> = {
  key: string;
  task: () => Promise<T>;
};
