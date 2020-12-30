import React, { memo, useState } from 'react'
import ReactDOM from 'react-dom'
import { defineModule } from 'zoov'
import { TodoList } from './todo'
import { todoModule } from './todo/module'

const counterModule = defineModule()
  .model({ count: 0, user: { name: 'xyy', age: 18 } })
  .actions({
    increase: (draft) => draft.count++,
    decrease: (draft) => draft.count--,
    reset: (draft) => (draft.count = 0),
    growUp: (draft) => draft.user.age++,
  })
  .views({
    doubled: (state) => state.count * 2,
    finishedCount: () => 2,
  })
  .init()

const App = () => {
  const count = counterModule.useCount()
  const doubled = counterModule.useDoubled()
  const user = counterModule.useUser()
  const { increase, decrease, reset, growUp } = counterModule.useActions()

  return (
    <div>
      <p>user: {JSON.stringify(user)}</p>
      <button onClick={growUp}>grow</button>
      <h1>{`count: ${count} doubled ${doubled}`}</h1>
      <button onClick={decrease}>-</button>
      <button onClick={increase}>+</button>
      <button onClick={reset}>reset</button>
      <h1>Todo</h1>
      <InputComponent />
      <TodoList />
    </div>
  )
}

const InputComponent = memo(() => {
  const [value, setValue] = useState('')
  const { addTodo } = todoModule.useActions()
  return (
    <div>
      <input value={value} onChange={(e) => setValue(e.target.value)} />
      <button onClick={() => addTodo(value)}>Add</button>
    </div>
  )
})

ReactDOM.render(<App />, document.getElementById('root'))
