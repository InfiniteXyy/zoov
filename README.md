<h1 align="center">ZOOV</h1>
<p align="center">✨ ZOOV = Zustand + Module</p>
<p align="center">
<a href="https://github.com/infinitexyy/zoov/actions"><img src="https://img.shields.io/github/workflow/status/infinitexyy/zoov/main.svg" alt="Build Status"></a>
<a href="https://codecov.io/gh/infinitexyy/zoov"><img src="https://img.shields.io/codecov/c/github/infinitexyy/zoov.svg" alt="Code Coverage"></a>
<a href="https://npmjs.com/package/zoov"><img src="https://img.shields.io/npm/v/zoov.svg" alt="npm-v"></a>
<a href="https://npmjs.com/package/zoov"><img src="https://img.shields.io/npm/dt/zoov.svg" alt="npm-d"></a>
<a href="https://bundlephobia.com/result?p=zoov"><img src="http://img.badgesize.io/https://unpkg.com/zoov/dist/zoov.js?compression=brotli&label=brotli" alt="brotli"></a>
</p>

## Features

- 😌 Comfortable type inference
- ✨ Immer, RxJS in the first class support
- 🍳 150 line code based on Zustand
- 🧮 Modular state management (Redux-like)
- 📖 Scope supported with Algebraic Effects

## Quick Start

You can try this [Example](https://stackblitz.com/edit/zoov-example)

Or install locally

```sh
yarn add rxjs immer zustand # peer dependencies
yarn add zoov
```

## First Glance

```tsx
const CounterModule = defineModule({ count: 0 })
  .actions({
    add: (draft) => draft.count++,
    minus: (draft) => draft.count--,
  })
  .computed({
    doubled: (state) => state.count * 2,
  })
  .build();

const App = () => {
  const [{ count }, { add }] = CounterModule.use();
  return <button onClick={add}>{count}</button>;
};

// state is shared
const App2 = () => {
  const { doubled } = CounterModule.useComputed();
  return <div>doubled: {doubled}</div>;
};
```

## More Examples

### Use Methods

```tsx
const CounterModule = defineModule({ count: 0 })
  .actions({
    add: (draft) => draft.count++,
    minus: (draft) => draft.count--,
  })
  .computed({
    doubled: (state) => state.count * 2,
  })
  .methods((perform, effect) => {
    const { add, minus } = perform.getActions();
    return {
      addAndMinus: () => {
        add();
        add();
        setTimeout(() => minus(), 100);
      },
      // async function is supported
      asyncAdd: async () => {
        await ...
        add()
      }
      // you can also declare an effect, like redux-observable
      addAfter: effect<number>((payload$) =>
        payload$.pipe(
          exhaustMap((timeout) => {
            return timer(timeout).pipe(tap(() => add()));
          })
        )
      ),
    };
  })
  .build();
```

### Use Selector

```tsx
const CounterModule = defineModule({ count: 0, input: 'hello' })
  .actions({
    add: (draft) => draft.count++,
    setInput: (draft, value: string) => (draft.input = value),
  })
  .build();

const App = () => {
  // <App /> will not rerender unless "count" changes
  const [count] = CounterModule.use((state) => state.count);
  return <span>{count}</span>;
};
```

### Use Middleware

```tsx
// see more examples in https://github.com/pmndrs/zustand/blob/master/src/middleware.ts
const Module = defineModule({ count: 0 })
  .actions({ add: (draft) => draft.count++ })
  .middleware((store) => persist(store, { name: 'counter' }))
  .build();
```

### Use Provider

```tsx
import { defineProvider } from 'zoov';
const CustomProvider = defineProvider((handle) => {
  // create a new Module scope for all its children(can be nested)
  handle(YourModule, {
    defaultState: {},
  });
  handle(AnotherModule, {
    defaultState: {},
  });
});

const App = () => {
  // if a Module is not handled by any of its parent, then used global scope
  return (
    <div>
      <CustomProvider>
        <Component />
      </CustomProvider>
      <Component />
    </div>
  );
};
```
