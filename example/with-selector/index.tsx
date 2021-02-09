import React, { FC, memo } from 'react';
import { defineModule } from '../../src';

const CounterModule = defineModule({ count: 0, input: 'hello' })
  .actions({
    add: (draft) => draft.count++,
    setInput: (draft, value: string) => (draft.input = value),
  })
  .build();

export const WithSelector: FC = memo(() => {
  const [{ count, input }, { add }] = CounterModule.use();

  return (
    <div>
      <h3>With Selector</h3>
      <p>
        count: <b style={{ marginRight: 20 }}>{count}</b> input: <b>{input}</b>
      </p>
      <button onClick={add}>+1</button>
      <InputComponent />
    </div>
  );
});

const InputComponent: FC = memo(() => {
  const [input, { setInput }] = CounterModule.use((state) => state.input);
  console.log('input component rerender');
  return <input value={input} onChange={(e) => setInput(e.target.value)} />;
});
