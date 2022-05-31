import React, { FC, memo } from 'react';
import { defineModule, defineProvider } from '../../src';
import { persist } from 'zustand/middleware';

const logModule = defineModule({ prefix: 'global log: ' })
  .methods(({ getState }) => ({
    log: (value: string | number) => console.log(`${getState().prefix}${value}`),
  }))
  .build();

const counterModule = defineModule({ count: 0 })
  .actions({
    add: (draft, value: number) => {
      draft.count += value;
    },
    reset: (draft) => (draft.count = 0),
  })
  .methods({
    addOne() {
      this.getActions().add(1);
      this.getActions(logModule).log('perform addOne');
    },
  })
  .build();

const LogProvider = defineProvider((handle) => {
  handle(logModule, {
    defaultValue: { prefix: 'custom log: ' },
  });
});

const PersistProvider = defineProvider((handle) => {
  handle(counterModule, {
    defaultValue: { count: 1 },
    middleware: (store) => persist(store, { name: 'count2' }),
  });
});

const Counter: React.FC<{ title: string }> = ({ title }) => {
  const { count } = counterModule.useState();
  const { addOne } = counterModule.useActions();
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
      <div style={{ display: 'grid', gridAutoFlow: 'column', gridGap: '20px' }}>
        <LogProvider>
          <Counter title={'log'} />
          <PersistProvider>
            <Counter title={'log & persist'} />
          </PersistProvider>
        </LogProvider>
        <PersistProvider>
          <Counter title={'persist'} />
        </PersistProvider>
      </div>
    </div>
  );
});
