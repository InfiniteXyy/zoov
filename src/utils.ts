/*Copyright (c) 2019 Alexander Reardon */
// A simple version of https://github.com/alexreardon/memoize-one
export function simpleMemoizedFn<T extends (arg: any) => any>(fn: T) {
  let cache: { lastResult: ReturnType<T>; lastArg: Parameters<T>[0]; lastThis: ThisParameterType<T> } | null = null;
  return function (this: ThisParameterType<T>, newArg: Parameters<T>[0]): ReturnType<T> {
    if (cache && newArg === cache.lastArg && cache.lastThis === this) {
      return cache.lastResult;
    }
    const lastResult = fn(newArg);
    cache = { lastResult, lastArg: newArg, lastThis: this };
    return lastResult;
  };
}
