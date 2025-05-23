## 0.5.9

- chore: update deps & update readme

## 0.5.8

- add `use-sync-external-store` as dev dependency as it's required in `zustand/traditional` in v5

## 0.5.7

- chore: upgrade dependencies

## 0.5.6

- feat: Add `getComputed` to module, support call `getComputed` in a method builder

## 0.5.5

- fix: Add `index.d.ts` file, update module resolve setting for `ts5` bundler resolver, Thanks contribution from [black7375](https://github.com/InfiniteXyy/zoov/pull/11#issuecomment-1614037786)

## 0.5.4

- fix: readme typo
- chore: add type inference utility `InferModule`

## 0.5.3

- fix: https://github.com/InfiniteXyy/zoov/issues/6 react-native bundle issue, refactor release file structure

## 0.5.0

- feat: Add `getStore`, `useStore` function to module
- feat: Add `subscribe` for module
- chore: Remove deprecated `setState`, prefer `$setState`

## 0.4.3

- chore: update dependencies

## 0.4.2

- chore: remove deprecated type def, update dependencies

## 0.4.1

- feat: make `action.setState` fallback to `$setState`, but it's deprecated, will be removed in next version

## 0.4.0

- breaking-changes: rename `action.setState` to `action.$setState`
- feat: add `$reset` to reset state to default value
- feat: stricter type checking with actions

## 0.3.5, 0.3.6

- fix: update peer dependency semver define, fix npm install issue

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
