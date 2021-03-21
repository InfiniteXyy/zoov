import React, { FC, memo, useMemo } from 'react';
import { defineModule, defineProvider } from '../../src';

const CounterModule = defineModule({ count: 0 })
  .actions({
    add: (draft) => draft.count++,
  })
  .build();

const CounterTransientProvider: FC = ({ children }) => {
  const ScopeProvider = useMemo(() => {
    return defineProvider((handle) => {
      handle(CounterModule, {});
    });
  }, []);
  return <ScopeProvider>{children}</ScopeProvider>;
};

const Counter: FC = memo(() => {
  const [{ count }, { add }] = CounterModule.use();
  return <button onClick={add}>{count}</button>;
});

const CounterContainer: FC = memo(() => {
  return (
    <CounterTransientProvider>
      <Counter />
    </CounterTransientProvider>
  );
});
export const WithTransientScope: FC = memo(() => {
  return (
    <div>
      <h3>With Transient Scope</h3>
      <CounterContainer />
      <CounterContainer />
      <CounterContainer />
    </div>
  );
});
