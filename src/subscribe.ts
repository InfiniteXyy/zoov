import { RawModule, StateRecord, SubscribeBuilder } from './types';

export function generateSubscribeBuilder<State extends StateRecord, T>(subscriber: SubscribeBuilder<State, T>) {
  const subscribeOption = typeof subscriber === 'object' ? subscriber : { listener: subscriber };

  const { selector = (i) => i, ...options } = subscribeOption;

  return (initialState: State) => {
    const equalityFn = options?.equalityFn || Object.is;
    let currentSlice = selector(initialState) as T;
    let _cleanup: () => void | undefined;
    const addCleanup = (cleanup: typeof _cleanup) => {
      _cleanup = cleanup;
    };
    const listener = (state: State) => {
      const nextSlice = selector(state) as T;
      if (!equalityFn(currentSlice, nextSlice)) {
        const previousSlice = currentSlice;
        _cleanup?.();
        options.listener((currentSlice = nextSlice), previousSlice, { addCleanup });
      }
    };
    if (options.fireImmediately ?? true) {
      options.listener(currentSlice, currentSlice, { addCleanup });
    }
    return listener;
  };
}
export function extendSubscribe<State extends StateRecord, T>(subscriber: SubscribeBuilder<State, T>, rawModule: RawModule<State>): RawModule<State> {
  rawModule.subscriptionBuilders = [...rawModule.subscriptionBuilders, generateSubscribeBuilder(subscriber)];
  return rawModule;
}
