import produce from 'immer';
import create, { EqualityChecker, StateCreator, StateSelector } from 'zustand';
import { Observable } from 'rxjs';
import { redux } from 'zustand/middleware';
import { effect, pick } from './utils';
import { BuildScopeSymbol, ModuleProviderOption, useScopeOr } from './scope';
import { ActionsRecord, ComputedRecord, MethodBuilder, MiddlewareBuilder, Module, ModuleContext, RawModule, Scope, ScopeGetter, ScopeReducer, StateRecord } from './types';

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
  const scopeBuilder = (props: ModuleProviderOption<State> & { getContext?: () => ModuleContext }): Scope<State> => {
    const { defaultValue = {}, middleware, getContext } = props;
    const scopeReducer: ScopeReducer<State> = (state, { type, payload }) => rawModule.reducers[type](...payload)(state);
    const stateCreator: StateCreator<State> = redux(scopeReducer, { ...state, ...defaultValue });
    const middlewares = middleware ? [middleware] : rawModule.middlewares;

    const self: Scope<State> = {
      state$: null,
      store: create(middlewares.reduce((acc, middleware) => middleware(acc), stateCreator)),
      actions: {},
      computed: {},
      getActions: () => self.actions,
      getState: () => self.store.getState(),
      getState$: () => {
        if (!self.state$) self.state$ = new Observable<State>((subscriber) => self.store.subscribe((state) => subscriber.next(state)));
        return self.state$;
      },
    };

    // bind Actions with dispatch, build methods
    const dispatch = self.store.getState().dispatch as (payload: { type: keyof ActionsRecord; payload: any }) => void;
    Object.keys(rawModule.reducers).forEach((key) => {
      self.actions[key] = (...args) => dispatch({ type: key, payload: args });
    });
    const getScope = (module?: Module): ScopeGetter => {
      if (!module) return self;
      return getContext?.()?.get(module) || module.global;
    };
    const performerBuilder = (): any => ({
      getState: (module?: Module) => getScope(module).getState(),
      getActions: (module?: Module) => getScope(module).getActions(),
      getState$: (module?: Module) => getScope(module).getState$(),
    });
    rawModule.methodsBuilders.forEach((builder) => {
      self.actions = { ...self.actions, ...builder(performerBuilder(), effect) };
    });

    // bind Computed
    Object.keys(rawModule.computed).forEach((key) => {
      Object.defineProperty(self.computed, key, {
        get: () => self.store(rawModule.computed[key]),
      });
    });
    return self;
  };

  const globalScope = scopeBuilder({});
  const useScope = () => useScopeOr(module, globalScope);

  const module = {
    use: (selector: StateSelector<State, unknown>, equalFn: EqualityChecker<unknown>) => [useScope().store(selector, equalFn), useScope().getActions()],
    useState: (selector: StateSelector<State, unknown>, equalFn: EqualityChecker<unknown>) => useScope().store(selector, equalFn),
    useActions: () => useScope().getActions(),
    useComputed: () => useScope().computed,
    useState$: () => useScope().getState$(),
    global: pick(globalScope, ['getState', 'getState$', 'getActions']),
    [BuildScopeSymbol]: scopeBuilder,
  } as Module<State>;

  return module;
};
