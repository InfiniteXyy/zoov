import React, { FC, memo } from 'react';
import { defineModule } from '../../src';
import { persist } from 'zustand/middleware';
import type { MiddlewareBuilder } from '../../src/types';

type State = { count: number };

// forked from https://github.com/pmndrs/zustand
const log: MiddlewareBuilder<State> = (config) => (set, get, api) =>
  config(
    (args) => {
      set(args);
      console.log('> set state', get());
    },
    () => {
      console.log('getting state');
      return get();
    },
    api
  );

const CounterModule = defineModule<State>({ count: 0 })
  .actions({
    add: (draft) => draft.count++,
    reset: (draft) => (draft.count = 0),
  })
  .middleware((store) => persist(store, { name: 'counter' }))
  .middleware((store) => log(store))
  .build();

export const WithMiddleware: FC = memo(() => {
  const { count } = CounterModule.useState();
  const { add, reset } = CounterModule.useActions();

  return (
    <div>
      <h3>With Middleware (persist & log)</h3>
      <p>
        count: <b>{count}</b>
      </p>
      <button onClick={add}>+1</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
});
