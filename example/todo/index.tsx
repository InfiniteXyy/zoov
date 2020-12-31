import React, { useEffect } from 'react';
import { todoModule } from './module';

export const TodoList = () => {
  const { list, isLoading, params } = todoModule.useState();
  const { toggleChecked, fetchList, updateType } = todoModule.useActions();
  const finishCount = todoModule.useFinishedCount();

  useEffect(() => {
    fetchList({ type: 'Frontend' });
  }, []);

  return (
    <div>
      <h3>{params.type} Todolist</h3>
      <button onClick={() => updateType(params.type === 'Frontend' ? 'Backend' : 'Frontend')}>Toggle List</button>
      <b>finished: {finishCount}</b>
      {isLoading && <div>loading</div>}
      <ul>
        {list.map((item) => (
          <li key={item.title}>
            <label>
              {item.title}
              <input type="checkbox" checked={item.checked} onChange={() => toggleChecked(item.title, !item.checked)} />
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
};
