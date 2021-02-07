import React, { FC, memo } from 'react';
import { defineModule, defineProvider } from '../../src';
import { persist } from 'zustand/middleware';

const LogModule = defineModule({ prefix: 'global provider: ' })
  .methods(({ getState }) => ({
    log: (value: string | number) => console.log(`${getState().prefix}${value}`),
  }))
  .build();

const CounterModule = defineModule({ count: 0 })
  .actions({
    add: (draft, value: number) => {
      draft.count += value;
    },
    reset: (draft) => (draft.count = 0),
  })
  .methods(({ getActions }) => ({
    addOne: () => {
      getActions().add(1);
      getActions(LogModule).log('perform addOne');
    },
  }))
  .build();

const CustomProvider = defineProvider((handle) => {
  handle(LogModule, {
    defaultValue: { prefix: 'custom provider: ' },
  });
  handle(CounterModule, {
    defaultValue: { count: 1 },
    middleware: (store) => persist(store, { name: 'count2' }),
  });
});

const Counter: React.FC<{ title: string }> = ({ title }) => {
  const { count } = CounterModule.useState();
  const { addOne } = CounterModule.useActions();
  return (
    <div>
      <p>
        {title}: <b>{count}</b>
      </p>
      <button onClick={addOne}>+1</button>
    </div>
  );
};

export const WithProvider: FC = memo(() => {
  return (
    <div>
      <h3>With Provider</h3>
      <div style={{ display: 'flex' }}>
        <Counter title={'global'} />
        <CustomProvider>
          <Counter title={'custom'} />
        </CustomProvider>
      </div>
    </div>
  );
});
