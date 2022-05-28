<h1 align="center">ZOOV</h1>
<p align="center">✨ ZOOV = Zustand + Module</p>
<p align="center">
<a href="https://github.com/infinitexyy/zoov/actions"><img src="https://img.shields.io/github/workflow/status/infinitexyy/zoov/main.svg" alt="Build Status"></a>
<a href="https://codecov.io/gh/infinitexyy/zoov"><img src="https://img.shields.io/codecov/c/github/infinitexyy/zoov.svg" alt="Code Coverage"></a>
<a href="https://npmjs.com/package/zoov"><img src="https://img.shields.io/npm/v/zoov.svg" alt="npm-v"></a>
<a href="https://npmjs.com/package/zoov"><img src="https://img.shields.io/npm/dt/zoov.svg" alt="npm-d"></a>
<a href="https://bundlephobia.com/result?p=zoov"><img src="https://badgen.net/bundlephobia/minzip/zoov@0.3.2" alt="minzip"></a>
</p>

## Features

- 😌 Easy: Comfortable type inference
- ✨ Magic: Update state by just mutate it (with support of immer)
- 🍳 Tiny: 160 line code based on Zustand
- 🧮 Powerful: Modular state management (Redux-like)
- 📖 Smart: Scope supported with Algebraic Effects
- 📦 Flexible: Attach state/actions inside or outside React

## Quick Start

You can try it on [StackBlitz](https://stackblitz.com/edit/vitejs-vite-mgdqal) or [CodeSandbox](https://codesandbox.io/s/zoov-example-8ggez)

Or install locally

```sh
yarn add immer zustand # peer dependencies
yarn add zoov
```

## First Glance

```typescript jsx
const { use: useCounter } = defineModule({ count: 0 })
  .actions({
    add: (draft) => draft.count++,
    minus: (draft) => draft.count--,
  })
  .computed({
    doubled: (state) => state.count * 2,
  })
  .build();

const App = () => {
  const [{ count }, { add }] = useCounter();
  return <button onClick={add}>{count}</button>;
};

// state is shared
const App2 = () => {
  const [, , { doubled }] = useCounter();
  return <div>doubled: {doubled}</div>;
};
```

## More Examples

### Use Methods

```typescript jsx
import { effect } from 'zoov/effect';

const CounterModule = defineModule({ count: 0 })
  .actions({
    add: (draft) => draft.count++,
    minus: (draft) => draft.count--,
  })
  .methods(({ getActions }) => {
    const { add, minus } = getActions();
    return {
      addAndMinus: () => {
        add();
        add();
        setTimeout(() => minus(), 100);
      },
      // async function is supported
      asyncAdd: async () => {
        await something();
        add();
      },
      // [TIPS] If you want to `rxjs` in `zoov`, your should first install `rxjs`
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

```typescript jsx
const { use: useCounter } = defineModule({ count: 0, input: 'hello' })
  .actions({
    add: (draft) => draft.count++,
    setInput: (draft, value: string) => (draft.input = value),
  })
  .build();

const App = () => {
  // <App /> will not rerender unless "count" changes
  const [count] = useCounter((state) => state.count);
  return <span>{count}</span>;
};
```

Additionally, you can install [react-tracked](https://github.com/dai-shi/react-tracked) and use `useTrackedModule` to automatically generate selector

```tsx
// will not rerender unless "count" changes
const [{ count }, { add }] = useTrackedModule(Module);
```

### Use Middleware

```typescript jsx
// see more examples in https://github.com/pmndrs/zustand/blob/master/src/middleware.ts
const Module = defineModule({ count: 0 })
  .actions({ add: (draft) => draft.count++ })
  .middleware((store) => persist(store, { name: 'counter' }))
  .build();
```

### Use default setState Action

```typescript jsx
// a lite copy of solid-js/store, with strict type check
const { useActions } = defineModule({ count: 0, nested: { checked: boolean } }).build();

const [{ setState }] = useActions();

setState('count', 1);
setState('nested', 'checked', (v) => !v);
```

### Use Provider

```typescript jsx
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

### Attach state outside components

```typescript jsx
// by default, it will get the state under global scope
const actions = module.getActions();
const state = module.getActions();

// you can specify the scope with params
const context = useScopeContext();
const scopeActions = module.getActions(context);
```
