<h1 align="center">ZOOV</h1>
<p align="center">✨ ZOOV = Zustand + module</p>
<p align="center">
<a href="https://github.com/infinitexyy/zoov/actions"><img src="https://img.shields.io/github/actions/workflow/status/infinitexyy/zoov/main.yml?branch=main" alt="Build Status"></a>
<a href="https://npmjs.com/package/zoov"><img src="https://img.shields.io/npm/v/zoov.svg" alt="npm-v"></a>
<a href="https://npmjs.com/package/zoov"><img src="https://img.shields.io/npm/dt/zoov.svg" alt="npm-d"></a>
<a href="https://github.com/InfiniteXyy/zoov"><img alt="GitHub License" src="https://img.shields.io/github/license/InfiniteXyy/zoov"></a>
<a href="https://bundlephobia.com/result?p=zoov"><img src="https://img.shields.io/bundlephobia/minzip/zoov" alt="minzip"></a>

</p>
<p align="center">
<a href="https://infinitexyy.gitbook.io/zoov">Read the docs</a>
</p>

## Features

- 😌 Easy: Comfortable type inference
- ✨ Magic: Update state by just mutate it (with support of immer)
- 🍳 Tiny: < 200 line code based on Zustand
- 🧮 Powerful: Modular state management (Redux-like)
- 📖 Smart: Scope supported with Algebraic Effects
- 📦 Flexible: Attach state/actions inside or outside React

## Quick Start

You can try it on [StackBlitz](https://stackblitz.com/edit/vitejs-vite-mgdqal) or [CodeSandbox](https://codesandbox.io/s/zoov-example-9q0eb5)

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

const counterModule = defineModule({ count: 0 })
  .actions({
    add: (draft) => draft.count++,
    minus: (draft) => draft.count--,
  })
  .methods(({ getActions }) => {
    return {
      addAndMinus: () => {
        getActions().add();
        getActions().add();
        setTimeout(() => getActions().minus(), 100);
      },
      // async function is supported
      asyncAdd: async () => {
        await something();
        getActions().add();
      },
      // [TIPS] If you want to `rxjs` in `zoov`, your should first install `rxjs`
      addAfter: effect<number>((payload$) =>
        payload$.pipe(
          exhaustMap((timeout) => {
            return timer(timeout).pipe(tap(() => getActions().add()));
          }),
        ),
      ),
    };
  })
  // using `this` is allowed now! remember to set `noImplicitThis` true in tsconfig
  .methods({
    addTwo() {
      this.getActions().add();
      this.getActions().add();
    },
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
const [{ count }, { add }] = useTrackedModule(module);
```

### Use subscriptions

```typescript
const module = defineModule({ pokemonIndex: 0, input: '' })
  .subscribe((state, prevState) => console.log(state)) // subscribe to the whole store
  .subscribe({
    selector: (state) => state.pokemonIndex, // only subscribe to some property
    listener: async (pokemonIndex, prev, { addCleanup }) => {
      const abortController = new AbortController();
      const abortSignal = abortController.signal;
      addCleanup(() => abortController.abort());
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonIndex}`, { signal: abortSignal });
      console.log(await response.json());
    },
  })
  .build();
```

### Use Middleware

```typescript jsx
// see more examples in https://github.com/pmndrs/zustand/blob/master/src/middleware.ts
const module = defineModule({ count: 0 })
  .actions({ add: (draft) => draft.count++ })
  .middleware((store) => persist(store, { name: 'counter' }))
  .build();
```

### Use internal Actions

```typescript jsx
// a lite copy of solid-js/store, with strict type check
const { useActions } = defineModule({ count: 0, nested: { checked: boolean } }).build();

const { $setState, $reset } = useActions();

$setState('count', 1);
$setState('nested', 'checked', (v) => !v);
$reset();
```

### Use Provider

```typescript jsx
import { defineProvider } from 'zoov';

const CustomProvider = defineProvider((handle) => {
  // create a new module scope for all its children(can be nested)
  handle(yourModule, {
    defaultState: {},
  });
  handle(anotherModule, {
    defaultState: {},
  });
});

const App = () => {
  // if a module is not handled by any of its parent, then used global scope
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
const state = module.getState();

// you can specify the scope with params
const context = useScopeContext();
const scopeActions = module.getActions(context);
```
