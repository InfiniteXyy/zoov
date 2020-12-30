import React, { useState } from 'react'
import { todoModule } from './module'

export const TodoList = () => {
  const [showUnchecked, setShowUnchecked] = useState(false)

  const list = todoModule.useList()
  const uncheckedList = todoModule.useUnchecked()

  const computedList = showUnchecked ? uncheckedList : list

  const { toggleCheck, deleteTodo } = todoModule.useActions()
  const finishCount = todoModule.useFinishedCount()

  return (
    <div>
      <div>finished: {finishCount}</div>
      <label>
        <input type="checkbox" checked={showUnchecked} onChange={() => setShowUnchecked(!showUnchecked)} />
        show unchecked
      </label>
      <ul>
        {computedList.map((item) => (
          <li key={item.title}>
            <button onClick={() => deleteTodo(item.title)}>x</button>
            {item.title}
            <input type="checkbox" checked={item.checked} onChange={() => toggleCheck(item.title)} />
          </li>
        ))}
      </ul>
    </div>
  )
}
