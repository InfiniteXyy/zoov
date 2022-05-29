import React, { FC, memo } from 'react';
import { defineModule } from '../../src';

const counterModule = defineModule({ count: 0 })
  .actions({
    add: (draft, payload: number = 1) => (draft.count += payload),
    minus: (draft, payload: number = 1) => (draft.count -= payload),
  })
  .computed({
    doubled: (state) => state.count * 2,
  })
  .build();

const { use: useCounter } = counterModule;

function addTwo() {
  // you can get the module state/actions outside components
  counterModule.getActions().add(2);
  console.log('after add 2, count is: ' + counterModule.getState().count);
}

export const BasicUsage: FC = memo(() => {
  const [{ count }, { add, minus }, { doubled }] = useCounter();

  return (
    <div>
      <h3>Basic Usage</h3>
      <p>
        count: <b style={{ marginRight: 20 }}>{count}</b> doubled: <b>{doubled}</b>
      </p>
      <button onClick={() => minus(1)}>-1</button>
      <button onClick={() => add(1)}>+1</button>
      <button onClick={addTwo}>+2</button>
    </div>
  );
});
