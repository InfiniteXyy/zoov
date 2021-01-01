import { defineModule } from 'zoov';
import { from } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { FetchType, mockFetchTodos, mockMutateChecked } from './utils';

type Todo = { title: string; checked: boolean };
type State = { list: Todo[]; isLoading: boolean; params: { type: FetchType } };

const TodoModule = defineModule()
  .model<State>({ list: [], isLoading: false, params: { type: 'Frontend' } })
  .views({
    finishedCount(state) {
      return state.list.filter((i) => i.checked).length;
    },
  })
  .actions({
    setType(draft, type: FetchType) {
      draft.params.type = type;
    },
    setLoading(draft, isLoading: boolean) {
      draft.isLoading = isLoading;
    },
    setTodos(draft, todos: Todo[]) {
      draft.list = todos;
    },
  })
  .methods(({ getActions, getState }, effect) => ({
    fetchList: effect<{ type: FetchType }>((payload$) => {
      return payload$.pipe(
        tap(() => getActions().setLoading(true)),
        switchMap(({ type }) => from(mockFetchTodos(type))),
        tap((todos) => getActions().setTodos(todos)),
        tap(() => getActions().setLoading(false))
      );
    }),
    // for simpler cases, you can also use async functions
    async toggleChecked(title: string, checked: boolean) {
      await mockMutateChecked(title, checked);
      const todos = getState().list;
      getActions().setTodos(todos.map((todo) => (todo.title === title ? { ...todo, checked } : todo)));
    },
  }))
  // use prev defined methods, split them into two sections for ts type infer
  .methods(({ getActions }) => ({
    updateType(type: FetchType) {
      getActions().setType(type);
      getActions().fetchList({ type });
    },
  }));

export const todoModule = TodoModule.init('todoModule');
