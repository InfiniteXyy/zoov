# ZOOV

一个基于 Zustand 的 React 模块化状态管理库

**ZOOV = Zustand + Module**

## 特点

- 😌 舒适的类型推断
- ✨ 拒绝繁琐的 Selector，自动生成状态 hooks
- 🍳 基于 Zustand 的简单的封装，没有魔法
- 🧮 模块化状态管理

## 快速启动

试试这个 [Example](https://codesandbox.io/s/zoov-example-vmv3p)

或在本地项目中安装

```sh
yarn add rxjs immer zustand # peer dependencies
yarn add zoov
```

## 示例

#### 基本功能

```tsx
// 1. 需要先定义一个 Module，并给予 defaultState
const Module = defineModule().model({ count: 0 });

// 2. 调用 Module 的 init 方法可以得到 module 实例
const module = Module.init();
// 2.5. 可以初始化多个实例，并给予不同的初始值，互相不会影响
const module2 = Module.init({ count: 1 });

// 3. 在任何 React 组件中使用 hooks
const App = () => {
  // count: number
  const count = module.useCount();
  return <div>{count}</div>;
};
```

#### 扩展 Module

```tsx
// 在定义 Module 的时候可以带有事件函数，也可以创建视图
const Module = defineModule()
  .model({ count: 0 })
  // 1. Action 是无副作用的状态变化
  .actions({
    increase: (draft, value) => draft.count += value, // 默认使用了 Immer
    decrease: (draft, value) => draft.count -= value,
    reset: (draft) => draft.count = 0,
  })
  // 2. Method 是一些复杂事件，可以组合 Actions，或使用异步函数
  .methods((self) => {
    async increaseAfter1s() {
      await new Promise(resolve => setTimeout(resolve, 1000))
      self.getActions().increase(1)
      console.log(self.getState())
    }
  })
  // 3. View 是基于状态计算出的属性，当状态变更后，会自动触发更新
  .views({
    doubled: (state) => state.count * 2
  })
```

#### 使用 RxJS

```tsx
const Module = defineModule()
  .model({ count: 0 })
  .actions({
    increase: (draft, value) => (draft.count += value),
    decrease: (draft, value) => (draft.count -= value),
    reset: (draft) => (draft.count = 0),
  })
  .methods((self, effect) => ({
    // 有时，只是 Async 函数可能无法满足需求
    // methods 的第二个参数 effect，允许用 RxJS 封装一个流
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

