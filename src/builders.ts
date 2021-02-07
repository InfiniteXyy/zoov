import produce from 'immer';
import create, { StateCreator, StateSelector, UseStore } from 'zustand';
import { Observable } from 'rxjs';
import { redux } from 'zustand/middleware';
import type { EqualityChecker } from 'zustand/vanilla';
import { effect } from './utils';
import type { ActionsRecord, MethodBuilder, RawModule, ScopeReducer, StateRecord, ComputedRecord, MiddlewareBuilder } from './types';

export const extendActions = (actions: ActionsRecord) => (rawModule: RawModule): RawModule => {
  const reducers: any = {};
  Object.keys(actions).forEach((key) => {
    reducers[key] = (...args: any[]) => produce((draft) => void actions[key](draft, ...args));
  });
  return { ...rawModule, reducers };
};

export const extendComputed = (computed: ComputedRecord) => (rawModule: RawModule): RawModule => ({
  ...rawModule,
  computed,
});

export const extendMethods = (builder: MethodBuilder) => (rawModule: RawModule): RawModule => ({
  ...rawModule,
  methodsBuilders: [...rawModule.methodsBuilders, builder],
});

export const extendMiddleware = (middleware: MiddlewareBuilder) => (rawModule: RawModule): RawModule => ({
  ...rawModule,
  middlewares: [...rawModule.middlewares, middleware],
});

export const buildModule = <State extends StateRecord>(state: State, rawModule: RawModule<State>) => () => {
  const scopeReducer: ScopeReducer<State> = (state, { type, payload }) => rawModule.reducers[type](...payload)(state);
  const stateCreator: StateCreator<State> = redux(scopeReducer, { ...state });

  const scope: { store: UseStore<State>; actions: ActionsRecord; computed: ComputedRecord } = {
    store: create(rawModule.middlewares.reduce((acc, middleware) => middleware(acc), stateCreator)),
    actions: {},
    computed: {},
  };

  // bind Actions with dispatch, build methods
  const dispatch = scope.store.getState().dispatch as (payload: { type: keyof ActionsRecord; payload: any }) => void;
  Object.keys(rawModule.reducers).forEach((key) => {
    scope.actions[key] = (...args) => dispatch({ type: key, payload: args });
  });
  const self = { getActions: () => scope.actions, getState: () => scope.store.getState() };
  rawModule.methodsBuilders.forEach((builder) => {
    scope.actions = { ...scope.actions, ...builder(self, effect) };
  });

  // bind Computed
  Object.keys(rawModule.computed).forEach((key) => {
    Object.defineProperty(scope.computed, key, {
      get: () => scope.store(rawModule.computed[key]),
    });
  });

  return {
    useActions: () => scope.actions,
    useComputed: () => scope.computed,
    useState: (selector: StateSelector<State, unknown>, equalFn: EqualityChecker<unknown>) => scope.store(selector, equalFn),
    getState: scope.store.getState,
    getActions: () => scope.actions,
    getState$: () => new Observable<State>((subscriber) => scope.store.subscribe((state) => subscriber.next(state))),
  };
};
