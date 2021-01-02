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
- ✨ No selector, state hooks are automatically generated
- 🍳 100 line, Simple Wrapper on Zustand
- 🧮 Modular state management

## Quick Start

You can try this [Example](https://codesandbox.io/s/zoov-example-vmv3p)

Or install locally

```sh
yarn add rxjs immer zustand # peer dependencies
yarn add zoov
```

## Examples

#### Basic

```tsx
// 1. Defined a Module with a defaultState
const Module = defineModule().model({ count: 0 });

// 2. Call init function to get a module instance
const module = Module.init();
// 2.5. Different module instances won't affect each other
const module2 = Module.init({ count: 1 });

// 3. Use auto-generated state hooks in your component
const App = () => {
  // count: number
  const count = module.useCount();
  return <div>{count}</div>;
};
```

#### Extend Module

```tsx
const Module = defineModule()
  .model({ count: 0 })
  // 1. Actions are pure immer reducers update state
  .actions({
    increase: (draft, value) => draft.count += value,
    decrease: (draft, value) => draft.count -= value,
    reset: (draft) => draft.count = 0,
  })
  // 2. Methods are powerful functions, like async function, and you can trigger actions or getState here
  .methods((self) => {
    async increaseAfter1s() {
      await new Promise(resolve => setTimeout(resolve, 1000))
      self.getActions().increase(1)
      console.log(self.getState())
    }
  })
  // 3. Views are computed properties based on state
  .views({
    doubled: (state) => state.count * 2
  })
```

#### Use RxJS

```tsx
const Module = defineModule()
  .model({ count: 0 })
  .actions({
    increase: (draft, value) => (draft.count += value),
    decrease: (draft, value) => (draft.count -= value),
    reset: (draft) => (draft.count = 0),
  })
  // Sometimes, we need RxJS to help us handle complex event
  // Here, the [effect] argument, is aimed to wrap an RxJS listener
  .methods((self, effect) => ({
    setTimer: effect<{ interval?: number }>((payload$) => {
      return payload$.pipe(
        switchMap(({ interval }) => {
          self.getActions().reset();
          if (!interval) return EMPTY;
          return timer(0, interval).pipe(
            tap(() => self.getActions().increase(1)),
            tap(() => {
              console.log(self.getState().count);
            })
          );
        })
      );
    }),
  }));
```

### TodoList

- [x] better Readme
- [x] support Effect
- [x] support redux dev tools
- [x] refactor with TS
- [x] Unit Test
- [ ] Persist helper
- [ ] computed values should only be triggered once
- [ ] support di?
- [ ] support svelte?
- [ ] selector in hooks?
