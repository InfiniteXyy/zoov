// use pipe for Code Reuse
// eg. loading, or utility methods

function withLoading() {
  return (factory) =>
    factory(
      model(() => ({ isLoading: false })),
      actions(() => ({
        setLoading: (draft, value) => (draft.isLoading = value),
      }))
    );
}

defineModule(
  model(() => ({ count: 0 })),
  withLoading(),
  actions(() => ({
    increase: (draft) => draft.count++,
  })),
  methods(({ getActions }) => ({
    increaseAfter1s: () => {
      getActions().setLoading(true);
      setTimeout(() => getActions.increase(), 1000);
      getActions().setLoading(false);
    },
  }))
).init({ count: 1 });
