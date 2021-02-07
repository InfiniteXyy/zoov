import produce from 'immer';
import create, { StateCreator, UseStore } from 'zustand';
import { devtools, redux, persist as persistMiddleware } from 'zustand/middleware';
import { capitalize, effect } from './utils';
import { ActionsRecord, InstanceOptions, MethodBuilder, Module, ScopeReducer, StateRecord, ViewsRecord } from './types';

export const extendActions = (actions: ActionsRecord) => (module: Module): Module => {
  const reducers: any = {};
  Object.keys(actions).forEach((key) => {
    reducers[key] = (...args: any[]) => produce((draft) => void actions[key](draft, ...args));
  });
  return { ...module, reducers };
};

export const extendViews = (views: ViewsRecord) => (module: Module): Module => ({ ...module, computed: views });

export const extendMethods = (builder: MethodBuilder) => (module: Module): Module => ({ ...module, methodsBuilders: [...module.methodsBuilders, builder] });

export const initInstance = <State extends StateRecord>(state: State, module: Module<State>) => (_options: InstanceOptions<State> | string = {}) => {
  const options = typeof _options === 'string' ? { name: _options } : _options;
  const { persist, name: moduleName, state: currentState = {} } = options;
  const isDev = process.env.NODE_ENV === 'development';

  const scopeReducer: ScopeReducer<State> = (state, { type, payload }) => module.reducers[type](...payload)(state);
  let stateCreator: StateCreator<State> = redux(scopeReducer, { ...state, ...currentState });
  if (persist) stateCreator = persistMiddleware(stateCreator, persist);
  if (isDev) stateCreator = devtools(stateCreator, moduleName);

  const scope: { store: UseStore<State>; actions: ActionsRecord; stateHooks: ViewsRecord } = {
    store: create(stateCreator),
    actions: {},
    stateHooks: {},
  };

  // bind Actions with dispatch, build methods
  const dispatch = scope.store.getState().dispatch as (payload: { type: keyof ActionsRecord; payload: any }) => void;
  Object.keys(module.reducers).forEach((key) => {
    scope.actions[key] = (...args) => dispatch({ type: key, payload: args });
  });
  const self = { getActions: () => scope.actions, getState: () => scope.store.getState() };
  module.methodsBuilders.forEach((builder) => {
    scope.actions = { ...scope.actions, ...builder(self, effect) };
  });
  // generate state, view hooks
  Object.keys(state).forEach((key) => {
    const selector = (state: State) => state[key];
    scope.stateHooks[`use${capitalize(key)}`] = () => scope.store(selector);
  });
  Object.keys(module.computed).forEach((key) => {
    scope.stateHooks[`use${capitalize(key)}`] = () => scope.store(module.computed[key]);
  });
  return {
    ...scope.stateHooks,
    useActions: () => scope.actions,
    useState: scope.store,
  };
};
