import { defineModule } from 'zoov'

type Todo = { title: string; checked: boolean }
type State = { list: Todo[] }

const TodoModule = defineModule()
  .model<State>({ list: [] })
  .actions({
    toggleCheck: (draft, title: string) =>
      draft.list.forEach((todo) => {
        if (todo.title === title) todo.checked = !todo.checked
      }),
    deleteTodo: (draft, title: string) => {
      draft.list = draft.list.filter((todo) => todo.title !== title)
    },
    addTodo: (draft, title: string) => {
      draft.list.push({ title, checked: false })
    },
  })
  .views({
    unchecked: (state) => state.list.filter((i) => !i.checked),
    finishedCount: (state) => state.list.filter((i) => i.checked).length,
  })

export const todoModule = TodoModule.init({ list: [{ title: 'vue', checked: false }] })
