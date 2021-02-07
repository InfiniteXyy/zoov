import produce from 'immer';
import create, { EqualityChecker, StateCreator, StateSelector } from 'zustand';
import { Observable } from 'rxjs';
import { redux } from 'zustand/middleware';
import { effect, pick } from './utils';
import { BuildScopeSymbol, ModuleProviderOption, useScopeOr } from './scope';
import { ActionsRecord, ComputedRecord, MethodBuilder, MiddlewareBuilder, Module, ModuleContext, RawModule, Scope, ScopeReducer, StateRecord } from './types';

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
      getState: (module?: Module) => {
        if (!module) return self.store.getState();
        const scope = getContext?.().get(module);
        return (scope ? scope.getState() : module.getState()) as any;
      },
      getActions: (module?: Module) => {
        if (!module) return self.actions;
        const scope = getContext?.().get(module);
        return (scope ? scope.getActions() : module.getActions()) as any;
      },
      getState$: (module?: Module) => {
        if (!module) {
          if (!self.state$) self.state$ = new Observable<State>((subscriber) => self.store.subscribe((state) => subscriber.next(state)));
          return self.state$;
        }
        const scope = getContext?.().get(module);
        return (scope ? scope.getState$() : module.getState$()) as any;
      },
    };

    // bind Actions with dispatch, build methods
    const dispatch = self.store.getState().dispatch as (payload: { type: keyof ActionsRecord; payload: any }) => void;
    Object.keys(rawModule.reducers).forEach((key) => {
      self.actions[key] = (...args) => dispatch({ type: key, payload: args });
    });

    rawModule.methodsBuilders.forEach((builder) => {
      self.actions = { ...self.actions, ...builder({ ...pick(self, ['getState', 'getState$', 'getActions']) }, effect) };
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
  const getScope = () => useScopeOr(module, globalScope);

  const module = {
    useState: (selector: StateSelector<State, unknown>, equalFn: EqualityChecker<unknown>) => getScope().store(selector, equalFn),
    useComputed: () => getScope().computed,
    useActions: () => getScope().actions,
    ...pick(globalScope, ['getState', 'getState$', 'getActions']),
    [BuildScopeSymbol]: scopeBuilder,
  } as Module<State>;

  return module;
};
