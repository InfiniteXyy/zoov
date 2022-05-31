## 0.3.4
- chore: add error msg for using getActions in methods builder function
- feat: support new object style methods builder, with support of `this`.

## 0.3.3
- feat: `computed` now will only be triggered when it's deps updated (based on react-tracked).
- feat: add `useModule` & `useModuleActions` shortcut hooks

## 0.3.2
- feat: `module.use` will return `computed` as third value
- feat: support `react-tracked` with `useTrackedModule`

## 0.3.1
- chore: refactor type definitions

## 0.3.0
- refactor: `effect` function is now moved to `zoov/effect`
- chore: use `zustand` v4
- chore: update cjs,mjs export map, it may fix some bundler related issues.
- fix: `computed` value will now only be triggered once through all the components
- feat: module now have `getActions` `getState` export

## 0.2.2
- fix package json utils type

## 0.2.1
- use unbuild for lib bundle, move `utils`(rxjs helper) to another entry
- fix zustand type issues
- [experimental] useActions 'setState' function updated type definitions

## 0.2.0
- remove `rxjs`, to reduce required size
- [experimental] useActions will include a 'setState' function by default, similar to solid-js/store

## 0.1.5
- export `effect` in `zoov` module (remove from `methods` params)
- zustand stores are now **lazy initialized** when used in React Component