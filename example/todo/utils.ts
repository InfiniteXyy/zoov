import { defineModule } from 'zoov';

export type FetchType = 'Frontend' | 'Backend';

let dbModule = defineModule()
  .model({
    db: [
      { title: 'vue', checked: false },
      { title: 'react', checked: false },
      { title: 'Java', checked: false },
      { title: 'Golang', checked: true },
    ],
  })
  .actions({
    setDb: (draft, db) => (draft.db = db),
  })
  .init({
    persist: {
      name: 'db',
    },
  });

export async function mockFetchTodos(type: FetchType) {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const db = dbModule.useState.getState().db;
  return type === 'Backend' ? db.slice(2) : db.slice(0, 2);
}

export async function mockMutateChecked(title: string, checked: boolean) {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const db = dbModule.useState.getState().db;
  dbModule.useActions().setDb(
    db.map((i) => {
      if (i.title === title) return { ...i, checked };
      return i;
    })
  );
  return 'ok';
}
