import { useMemo } from 'react';
import produce from 'immer';
import create, { EqualityChecker, StateCreator, StateSelector } from 'zustand';
import { Observable } from 'rxjs';
import { redux } from 'zustand/middleware';
import { effect } from './utils';
import { useScopeContext, useScopeOr, BuildScopeSymbol } from './context';
import { ActionsRecord, ComputedRecord, StateRecord } from './types';
import { Module, RawModule, ScopeContext, Scope, ScopeReducer } from './types';
import { MethodBuilder, MiddlewareBuilder, Perform, ScopeBuildOption } from './types';

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
  const scopeBuilder = (props: ScopeBuildOption<State>): Scope<State> => {
    const { defaultValue = {}, middleware } = props;

    const scopeReducer: ScopeReducer<State> = (state, { type, payload }) => rawModule.reducers[type](...payload)(state);
    const stateCreator: StateCreator<State> = redux(scopeReducer, { ...state, ...defaultValue });
    const middlewares = middleware ? [middleware] : rawModule.middlewares;

    const computed: ComputedRecord = {};
    let state$: Observable<State> | null = null;
    let cachedActions: ActionsRecord | null = null;
    const cachedActionsMap = new WeakMap<ScopeContext, ActionsRecord>();

    const self: Scope<State> = {
      store: create(middlewares.reduce((acc, middleware) => middleware(acc), stateCreator)),
      getComputed: () => computed,
      getActions: (context?: ScopeContext) => {
        const cachedAction = context ? cachedActionsMap.get(context) : cachedActions;
        if (cachedAction) return cachedAction;
        // build actions
        let actions: ActionsRecord = {};
        // bind Actions with dispatch, build methods
        const dispatch = self.store.getState().dispatch as (payload: { type: keyof ActionsRecord; payload: any }) => void;
        Object.keys(rawModule.reducers).forEach((key) => {
          actions[key] = (...args) => dispatch({ type: key, payload: args });
        });
        const getScope = (module?: Module): Scope => {
          if (!module) return self;
          return context?.get(module) || module.global;
        };
        const perform: Perform = {
          getState: (module?: Module): StateRecord => getScope(module).getState(),
          getActions: (module?: Module) => getScope(module).getActions(),
          getState$: (module?: Module) => getScope(module).getState$(),
        } as Perform;
        rawModule.methodsBuilders.forEach((builder) => {
          actions = { ...actions, ...builder(perform, effect) };
        });
        if (context) {
          cachedActionsMap.set(context, actions);
        } else {
          cachedActions = actions;
        }
        return actions;
      },
      getState: () => self.store.getState(),
      getState$: () => {
        if (!state$) state$ = new Observable<State>((subscriber) => self.store.subscribe((state) => subscriber.next(state)));
        return state$;
      },
    };
    // bind Computed
    Object.keys(rawModule.computed).forEach((key) => {
      Object.defineProperty(computed, key, {
        get: () => self.store(rawModule.computed[key]),
      });
    });
    return self;
  };

  const globalScope = scopeBuilder({});
  const useScope = () => useScopeOr(module, globalScope);

  const module = {
    useState: (selector: StateSelector<State, unknown>, equalFn: EqualityChecker<unknown>) => useScope().store(selector, equalFn),
    useActions: () => {
      const context = useScopeContext();
      const scope = useScope();
      return useMemo(() => scope.getActions(context), [context]);
    },
    useComputed: () => useScope().getComputed(),
    useState$: () => useScope().getState$(),
    use: (...args) => [module.useState(...args), module.useActions()],
    global: globalScope,
    [BuildScopeSymbol]: scopeBuilder,
  } as Module<State>;

  return module;
};
