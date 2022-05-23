import React, { FC, memo } from 'react';
import { defineModule } from '../../src';

function getFibonacci(index: number): number {
  // fibonacci with low performance
  if (index < 0) return 0;
  if (index === 0 || index === 1) return 1;
  return getFibonacci(index - 1) + getFibonacci(index - 2);
}

const { use: useCounter, useComputed: useCounterComputed } = defineModule({ count: 10 })
  .actions({
    add: (draft) => draft.count++,
    minus: (draft) => draft.count--,
  })
  .computed({
    fibonacci: (state) => {
      const result = getFibonacci(state.count);
      console.log(`fibonacci ${state.count} = ${result}`);
      // Heavy work
      return result;
    },
  })
  .build();

const FibonacciResult = () => {
  const { fibonacci } = useCounterComputed();
  return <b style={{ marginLeft: 4 }}>{fibonacci}</b>;
};

export const WithComputed: FC = memo(() => {
  const [{ count }, { add, minus }] = useCounter();

  return (
    <div>
      <h3>With Computed</h3>
      <small>The result will not be computed multiple times</small>
      <p>
        fibonacci {count} =
        <FibonacciResult />
        <FibonacciResult />
        <FibonacciResult />
      </p>
      <button onClick={minus}>-1</button>
      <button onClick={add} disabled={count >= 30}>
        +1
      </button>
    </div>
  );
});
