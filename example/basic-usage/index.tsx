import React, { FC, memo } from 'react';
import { defineModule } from '../../src';

const { use: useCounter, useComputed: useCounterComputed } = defineModule({ count: 0 })
  .actions({
    add: (draft) => draft.count++,
    minus: (draft) => draft.count--,
  })
  .computed({
    doubled: (state) => state.count * 2,
  })
  .build();

export const BasicUsage: FC = memo(() => {
  const [{ count }, { add, minus }] = useCounter();
  const { doubled } = useCounterComputed();

  return (
    <div>
      <h3>Basic Usage</h3>
      <p>
        count: <b style={{ marginRight: 20 }}>{count}</b> doubled: <b>{doubled}</b>
      </p>
      <button onClick={minus}>-1</button>
      <button onClick={add}>+1</button>
    </div>
  );
});
