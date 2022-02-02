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