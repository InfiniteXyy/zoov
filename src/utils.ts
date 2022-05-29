import { createProxy, isChanged } from 'proxy-compare';
// inspired by https://github.com/alexreardon/memoize-one Copyright (c) 2019 Alexander Reardon
// deps change based on proxy-compare by dai-shi https://github.com/dai-shi/proxy-compare

export function simpleMemoizedFn<T extends (state: any) => any>(fn: T) {
  const affected = new WeakMap();
  let cache: { lastResult: ReturnType<T>; lastState: Parameters<T>[0] } | null = null;
  return function (state: Parameters<T>[0]): ReturnType<T> {
    if (cache) {
      if (state === cache.lastState) {
        // If the state is the same, return the cached result
        return cache.lastResult;
      }
      if (!isChanged(cache.lastState, state, affected)) {
        // If the state changes, but the require dependencies are the same, return the cached result
        return cache.lastResult;
      }
    }
    const proxy = createProxy(state, affected);
    const lastResult = fn(proxy);
    cache = { lastResult, lastState: state };
    return lastResult;
  };
}
