export type FetchType = 'Frontend' | 'Backend';

let db = [
  { title: 'vue', checked: false },
  { title: 'react', checked: false },
  { title: 'Java', checked: false },
  { title: 'Golang', checked: true },
];

export async function mockFetchTodos(type: FetchType) {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return type === 'Backend' ? db.slice(2) : db.slice(0, 2);
}

export async function mockMutateChecked(title: string, checked: boolean) {
  await new Promise((resolve) => setTimeout(resolve, 300));
  db = db.map((i) => {
    if (i.title === title) return { ...i, checked };
    return i;
  });
  return 'ok';
}
