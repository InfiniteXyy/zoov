// paste from zustand/middleware.d.ts v3.3.0
type StateStorage = {
  getItem: (name: string) => string | null | Promise<string | null>;
  setItem: (name: string, value: string) => void | Promise<void>;
};
type StorageValue<S> = {
  state: S;
  version: number;
};
export type PersistOptions<S> = {
  /** Name of the storage (must be unique) */
  name: string;
  /**
   * A function returning a storage.
   * The storage must fit `window.localStorage`'s api (or an async version of it).
   * For example the storage could be `AsyncStorage` from React Native.
   *
   * @default () => localStorage
   */
  getStorage?: () => StateStorage;
  /**
   * Use a custom serializer.
   * The returned string will be stored in the storage.
   *
   * @default JSON.stringify
   */
  serialize?: (state: StorageValue<S>) => string | Promise<string>;
  /**
   * Use a custom deserializer.
   *
   * @param str The storage's current value.
   * @default JSON.parse
   */
  deserialize?: (str: string) => StorageValue<S> | Promise<S>;
  /**
   * Prevent some items from being stored.
   */
  blacklist?: (keyof S)[];
  /**
   * Only store the listed properties.
   */
  whitelist?: (keyof S)[];
  /**
   * A function returning another (optional) function.
   * The main function will be called before the storage rehydration.
   * The returned function will be called after the storage rehydration.
   */
  onRehydrateStorage?: (state: S) => ((state: S) => void) | void;
  /**
   * If the stored state's version mismatch the one specified here, the storage will not be used.
   * This is useful when adding a breaking change to your store.
   */
  version?: number;
};
