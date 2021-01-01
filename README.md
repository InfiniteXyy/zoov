# ZOOV

[中文](https://github.com/InfiniteXyy/zoov/blob/main/README.zh.md)

A React modular state management, based on Zustand

**ZOOV = Zustand + Module**

## Features

- 😌 Comfortable type inference
- ✨ No tedious State-Selector, auto-generate state hooks
- 🍳 Simple Wrapper on Zustand
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
  // 1. Actions are pure functions to cause state update (based on immer)
  .actions({
    increase: (draft, value) => draft.count += value,
    decrease: (draft, value) => draft.count -= value,
    reset: (draft) => draft.count = 0,
  })
  // 2. Methods are more powerful functions, like async function, and you can trigger actions or getState here
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
  .methods((self, effect) => ({
    // Sometimes, we need RxJS to handle more complex event
    // the second argument effect, is aimed to wrap RxJS flow
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
- [ ] Persist helper
- [ ] Unit Test
- [ ] refactor with TS
- [ ] support selector in hooks
- [ ] support di?
- [x] support redux dev tools
- [ ] computed values should only be triggered once
