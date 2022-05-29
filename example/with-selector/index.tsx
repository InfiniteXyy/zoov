import React, { FC, memo } from 'react';
import { createTrackedSelector } from 'react-tracked';
import { defineModule } from '../../src';

const counterModule = defineModule({ count: 0, input: 'hello' })
  .actions({
    add: (draft) => draft.count++,
    setInput: (draft, value: string) => (draft.input = value),
  })
  .build();

export const WithSelector: FC = memo(() => {
  const [{ count, input }] = counterModule.use();

  return (
    <div>
      <h3>With Selector</h3>
      <p>
        count: <b style={{ marginRight: 20 }}>{count}</b> input: <b>{input}</b>
      </p>
      <CounterComponent />
      <InputComponent />
    </div>
  );
});

const InputComponent: FC = memo(() => {
  const [input, { setInput }] = counterModule.use((state) => state.input);
  console.log('input component rerender');
  return <input value={input} onChange={(e) => setInput(e.target.value)} />;
});

const useCounterModuleState = createTrackedSelector(counterModule.useState);
const CounterComponent: FC = memo(() => {
  const { add } = counterModule.useActions();
  const { count } = useCounterModuleState();
  console.log('counter component rerender');
  return <button onClick={add}>{count}</button>;
});
