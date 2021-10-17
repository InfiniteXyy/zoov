import React, { FC, memo } from 'react';
import { defineModule } from '../../src';

const Module = defineModule({ info: { name: 'xyy', age: 12 }, checked: false }).build();

const AnotherModule = defineModule({})
  .methods(({ getActions }) => ({
    toggleChecked: () => {
      getActions(Module).setState('checked', (checked) => !checked);
    },
  }))
  .build();

export const WithSetState: FC = memo(() => {
  const [state, { setState }] = Module.use();
  const { toggleChecked } = AnotherModule.useActions();

  return (
    <div>
      <h3>With setState action</h3>
      <div>{JSON.stringify(state)}</div>
      <button onClick={() => setState('info', 'age', (age) => age + 1)}>grow</button>
      <input value={state.info.name} onChange={(e) => setState('info', 'name', e.target.value)} />
      <input type="checkbox" checked={state.checked} onChange={toggleChecked} />
    </div>
  );
});
